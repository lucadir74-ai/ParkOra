import './SignalModal.css'

export default function SignalModal({ onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">🚗</div>
        <h2 className="modal-title">Stai uscendo?</h2>
        <p className="modal-sub">
          Segnala il tuo posto — altri automobilisti ti ringrazieranno
        </p>
        <div className="modal-timer-label">Il segnale scade automaticamente dopo 10 minuti</div>
        <div className="modal-timer-bar">
          <div className="modal-timer-fill" />
        </div>
        <button className="btn-confirm" onClick={() => onConfirm('singolo')}>
          ✓ Conferma e segnala
        </button>
        <button className="btn-cancel" onClick={onClose}>
          Annulla
        </button>
      </div>
    </div>
  )
}
