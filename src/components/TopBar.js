import { useNavigate } from 'react-router-dom'
import './TopBar.css'

export default function TopBar() {
  const navigate = useNavigate()

  return (
    <div className="topbar">
      <div className="topbar-logo">
        Park<span className="topbar-accent">Ora</span>
      </div>
      <button className="topbar-profile" onClick={() => navigate('/profilo')} aria-label="Profilo">
        👤
      </button>
    </div>
  )
}
