import { useEffect, useState, useCallback, useRef } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { getPinColor, isExpired, PIN_EXPIRY_MINUTES } from '../constants'
import SignalModal from '../components/SignalModal'
import PinPopup from '../components/PinPopup'
import TopBar from '../components/TopBar'
import 'mapbox-gl/dist/mapbox-gl.css'
import './Mappa.css'

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN

const APPIO_TUSCOLANO = { latitude: 41.8719, longitude: 12.5239, zoom: 15 }

export default function Mappa() {
  const { user } = useAuth()
  const [segnalazioni, setSegnalazioni] = useState([])
  const [selectedPin, setSelectedPin] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('singolo')
  const [userPosition, setUserPosition] = useState(null)
  const [viewState, setViewState] = useState(APPIO_TUSCOLANO)
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
        await supabase
          .from('segnalazioni')
          .update({ attiva: false })
          .in('id', scadute.map(s => s.id))
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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords
          setUserPosition({ latitude, longitude })
          setViewState(v => ({ ...v, latitude, longitude }))
        },
        () => {}
      )
    }
  }, [])

  function openModal(type) {
    setModalType(type)
    setShowModal(true)
  }

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
      tipo,
      attiva: true,
    })

    if (!error) {
      await supabase.rpc('increment_segnalazioni', { uid: user.id })
      fetchSegnalazioni()
    }
  }

  function getMinutesAgo(createdAt) {
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    if (mins === 0) return 'adesso'
    return `${mins} min fa`
  }

  function getExpireIn(createdAt) {
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 60000
    const remaining = Math.ceil(PIN_EXPIRY_MINUTES - elapsed)
    return remaining > 0 ? `${remaining} min` : 'scaduto'
  }

  return (
    <div className="mappa-container">
      <TopBar />

      <Map
        {...viewState}
        onMove={e => setViewState(e.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {userPosition && (
          <Marker latitude={userPosition.latitude} longitude={userPosition.longitude}>
            <div className="user-marker" />
          </Marker>
        )}

        {segnalazioni.map(s => (
          <Marker
            key={s.id}
            latitude={s.latitudine}
            longitude={s.longitudine}
            onClick={e => { e.originalEvent.stopPropagation(); setSelectedPin(s) }}
          >
            <div
              className={`map-pin ${s.tipo === 'zona' ? 'pin-zona' : 'pin-singolo'}`}
              style={{ background: getPinColor(s.created_at) }}
            >
              {s.tipo === 'zona' ? '📍' : '🚗'}
            </div>
          </Marker>
        ))}

        {selectedPin && (
          <PinPopup
            pin={selectedPin}
            minutesAgo={getMinutesAgo(selectedPin.created_at)}
            expireIn={getExpireIn(selectedPin.created_at)}
            color={getPinColor(selectedPin.created_at)}
            onClose={() => setSelectedPin(null)}
          />
        )}
      </Map>

      <div className="mappa-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#2ecc71' }} />libero ora</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#f39c12' }} />4+ min</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#e74c3c' }} />scadendo</span>
      </div>

      <div className="mappa-actions">
        <button className="btn-signal" onClick={() => openModal('singolo')}>
          🚗 Sto uscendo
        </button>
        <button className="btn-zone" onClick={() => openModal('zona')}>
          📍 Segnala zona libera
        </button>
      </div>

      {showModal && (
        <SignalModal
          tipo={modalType}
          onConfirm={handleSignal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
