export const PIN_EXPIRY_MINUTES = 10

export const PIN_COLORS = {
  fresh: '#2ecc71',   // 0-4 min
  aging: '#f39c12',   // 4-7 min
  expiring: '#e74c3c' // 7-10 min
}

export const NOTIFICATION_RADIUS_METERS = 400

export const BADGE_LEVELS = [
  { id: 'cercatore',     label: 'Cercatore',     min: 0,   color: '#3498db', emoji: '🔵' },
  { id: 'parcheggiatore',label: 'Parcheggiatore',min: 5,   color: '#2ecc71', emoji: '🟢' },
  { id: 'habitue',       label: 'Habitué',        min: 25,  color: '#f1c40f', emoji: '🟡' },
  { id: 'esperto',       label: 'Esperto',        min: 100, color: '#e67e22', emoji: '🟠' },
  { id: 'sentinella',    label: 'Sentinella',     min: 300, color: '#e74c3c', emoji: '🔴' },
]

export const WEEKLY_BADGE_THRESHOLD = 3

export function getBadgeForCount(count) {
  return [...BADGE_LEVELS].reverse().find(b => count >= b.min) || BADGE_LEVELS[0]
}

export function getNextBadge(count) {
  return BADGE_LEVELS.find(b => b.min > count) || null
}

export function getPinColor(createdAt) {
  const ageMinutes = (Date.now() - new Date(createdAt).getTime()) / 60000
  if (ageMinutes < 4) return PIN_COLORS.fresh
  if (ageMinutes < 7) return PIN_COLORS.aging
  return PIN_COLORS.expiring
}

export function isExpired(createdAt) {
  const ageMinutes = (Date.now() - new Date(createdAt).getTime()) / 60000
  return ageMinutes >= PIN_EXPIRY_MINUTES
}
