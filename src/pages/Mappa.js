import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { getPinColor, isExpired, PIN_EXPIRY_MINUTES } from '../constants'
import SignalModal from '../components/SignalModal'
import TopBar from '../components/TopBar'
import 'leaflet/dist/leaflet.css'
import './Mappa.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createPinIcon(color, tipo) {
  const emoji = tipo === 'zona' ? '📍' : '🚗'
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:36px;height:36px;
      border-radius:${tipo === 'zona' ? '8px' : '50% 50% 50% 0'};
      transform:${tipo === 'zona' ? 'none' : 'rotate(-45deg)'};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      font-size:16px;
    "><span style="transform:${tipo === 'zona' ? 'none' : 'rotate(45deg)'};">${emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  })
}

function createUserIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:16px;
      border-radius:50%;
      background:#1a1a2e;
      border:3px solid #fff;
      box-shadow:0 0 0 2px #1a1a2e;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function LocationUpdater({ onLocation }) {
  const map = useMap()
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        map.setView([latitude, longitude], 16)
        onLocation({ lat: latitude, lng: longitude })
      },
      err => {
        console.warn('Geolocation error:', err)
        map.locate({ setView: true, maxZoom: 16 })
        map.on('locationfound', e => onLocation(e.latlng))
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [map, onLocation])
  return null
}

const APPIO_CENTER = [41.8719, 12.5239]

export default function Mappa() {
  const { user } = useAuth()
  const [segnalazioni, setSegnalazioni] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [userPosition, setUserPosition] = useState(null)
  const intervalRef = useRef(null)

  const fetchSegnalazioni = useCallback(async () => {
    const { data, error } = await supabase
      .from('segnalazioni')
      .select('*')
      .eq('attiva', true)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const attive = data.filter(s => !isExpired(s.created_at))
      setSegnalazioni(attive)
      const scadute = data.filter(s => isExpired(s.created_at))
      if (scadute.length > 0) {
        await supabase.from('segnalazioni').update({ attiva: false }).in('id', scadute.map(s => s.id))
      }
    }
  }, [])

  useEffect(() => {
    fetchSegnalazioni()
    intervalRef.current = setInterval(fetchSegnalazioni, 30000)

    const channel = supabase
      .channel('segnalazioni-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'segnalazioni' }, fetchSegnalazioni)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'segnalazioni' }, fetchSegnalazioni)
      .subscribe()

    return () => {
      clearInterval(intervalRef.current)
      supabase.removeChannel(channel)
    }
  }, [fetchSegnalazioni])

  const handleLocation = useCallback((latlng) => {
    setUserPosition({ latitude: latlng.lat, longitude: latlng.lng })
  }, [])

  async function handleSignal(tipo) {
    if (!userPosition) {
      alert('Attiva la geolocalizzazione per segnalare un posto')
      return
    }
    setShowModal(false)

    const { error } = await supabase.from('segnalazioni').insert({
      user_id: user.id,
      latitudine: userPosition.latitude,
      longitudine: userPosition.longitude,
      tipo: 'singolo',
      attiva: true,
    })

    if (!error) {
      await supabase.rpc('increment_segnalazioni', { uid: user.id })
      fetchSegnalazioni()
    }
  }

  function getMinutesAgo(createdAt) {
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    return mins === 0 ? 'adesso' : `${mins} min fa`
  }

  function getExpireIn(createdAt) {
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 60000
    const remaining = Math.ceil(PIN_EXPIRY_MINUTES - elapsed)
    return remaining > 0 ? `${remaining} min` : 'scaduto'
  }

  return (
    <div className="mappa-container">
      <TopBar />

      <MapContainer
        center={APPIO_CENTER}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationUpdater onLocation={handleLocation} />

        {userPosition && (
          <Marker
            position={[userPosition.latitude, userPosition.longitude]}
            icon={createUserIcon()}
          />
        )}

        {segnalazioni.map(s => (
          <Marker
            key={s.id}
            position={[s.latitudine, s.longitudine]}
            icon={createPinIcon(getPinColor(s.created_at), s.tipo)}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <p style={{ fontWeight: 600, margin: '0 0 4px', fontSize: 14 }}>
                  {s.tipo === 'zona' ? '📍 Zona libera' : '🚗 Posto singolo'}
                </p>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 2px' }}>
                  Segnalato {getMinutesAgo(s.created_at)}
                </p>
                <p style={{ fontSize: 12, color: '#e74c3c', margin: '0 0 10px' }}>
                  Scade tra {getExpireIn(s.created_at)}
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitudine},${s.longitudine}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    background: '#2ecc71',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                  }}
                >
                  🧭 Naviga qui
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legenda */}
      <div className="mappa-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#2ecc71' }} />libero ora</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#f39c12' }} />4+ min</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#e74c3c' }} />scadendo</span>
      </div>

      <div className="fab-container">
        <button className="fab-main" onClick={() => setShowModal(true)}>
          🚗 Sto uscendo
        </button>
      </div>

      {showModal && (
        <SignalModal
          
          onConfirm={handleSignal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
