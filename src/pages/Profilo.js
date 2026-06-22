import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { getBadgeForCount, getNextBadge, BADGE_LEVELS } from '../constants'
import './Profilo.css'

export default function Profilo() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('segnalazioni_totali, segnalazioni_settimana, created_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setStats(data))
  }, [user])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const totali = stats?.segnalazioni_totali ?? 0
  const settimana = stats?.segnalazioni_settimana ?? 0
  const badge = getBadgeForCount(totali)
  const nextBadge = getNextBadge(totali)
  const progressPct = nextBadge
    ? Math.round(((totali - badge.min) / (nextBadge.min - badge.min)) * 100)
    : 100

  return (
    <div className="profilo-container">
      <div className="profilo-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Mappa</button>
        <h1 className="profilo-title">Profilo</h1>
        <div style={{ width: 60 }} />
      </div>

      <div className="profilo-body">
        <div className="badge-card">
          <div className="badge-emoji">{badge.emoji}</div>
          <div className="badge-name">{badge.label}</div>
          <div className="badge-sub">{totali} segnalazioni totali</div>

          {nextBadge && (
            <>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="progress-label">
                {nextBadge.min - totali} segnalazioni al prossimo livello ({nextBadge.emoji} {nextBadge.label})
              </div>
            </>
          )}
          {!nextBadge && (
            <div className="progress-label">🏆 Hai raggiunto il livello massimo!</div>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{totali}</div>
            <div className="stat-label">Totale</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: settimana >= 3 ? '#2ecc71' : '#f39c12' }}>
              {settimana}
            </div>
            <div className="stat-label">
              Questa settimana
              {settimana >= 3 && <span className="weekly-badge"> ✓ Attivo</span>}
            </div>
          </div>
        </div>

        <div className="levels-section">
          <h3 className="levels-title">Livelli</h3>
          {BADGE_LEVELS.map(level => (
            <div key={level.id} className={`level-row ${totali >= level.min ? 'level-reached' : 'level-locked'}`}>
              <span className="level-emoji">{level.emoji}</span>
              <div className="level-info">
                <span className="level-name">{level.label}</span>
                <span className="level-req">{level.min === 0 ? 'Livello base' : `${level.min} segnalazioni`}</span>
              </div>
              {totali >= level.min && <span className="level-check">✓</span>}
            </div>
          ))}
        </div>

        <div className="profilo-email">{user?.email}</div>

        <button className="btn-logout" onClick={handleSignOut}>
          Esci dall'account
        </button>
      </div>
    </div>
  )
}
