import './SignalModal.css'

export default function SignalModal({ tipo, onConfirm, onClose }) {
  const isSingolo = tipo === 'singolo'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">{isSingolo ? '🚗' : '📍'}</div>
        <h2 className="modal-title">
          {isSingolo ? 'Stai uscendo?' : 'Zona libera vicino a te?'}
        </h2>
        <p className="modal-sub">
          {isSingolo
            ? 'Segnala il tuo posto — altri automobilisti ti ringrazieranno'
            : 'Segnala che nella tua zona ci sono più posti liberi (raggio ~30m)'}
        </p>
        <div className="modal-timer-label">Il segnale scade automaticamente dopo 10 minuti</div>
        <div className="modal-timer-bar">
          <div className="modal-timer-fill" />
        </div>
        <button className="btn-confirm" onClick={() => onConfirm(tipo)}>
          ✓ Conferma e segnala
        </button>
        <button className="btn-cancel" onClick={onClose}>
          Annulla
        </button>
      </div>
    </div>
  )
}
