import { Popup } from 'react-map-gl'
import './PinPopup.css'

export default function PinPopup({ pin, minutesAgo, expireIn, color, onClose }) {
  return (
    <Popup
      latitude={pin.latitudine}
      longitude={pin.longitudine}
      onClose={onClose}
      closeOnClick={false}
      offset={20}
    >
      <div className="pin-popup">
        <div className="popup-dot" style={{ background: color }} />
        <div className="popup-info">
          <p className="popup-tipo">
            {pin.tipo === 'zona' ? '📍 Zona libera' : '🚗 Posto singolo'}
          </p>
          <p className="popup-time">Segnalato {minutesAgo}</p>
          <p className="popup-expire">Scade tra {expireIn}</p>
        </div>
      </div>
    </Popup>
  )
}
