// Seconds → "HH:MM:SS" (or "MM:SS" under an hour).
export function formatDuration(total: number): string {
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const parts = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds]
  return parts.map((n) => String(n).padStart(2, '0')).join(':')
}

// "SS", "MM:SS" or "HH:MM:SS" → seconds; NaN when malformed so the server rejects it.
export function parseDuration(value: string): number {
  const parts = value.trim().split(':')
  if (parts.length === 0 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p)))
    return Number.NaN
  return parts.map(Number).reduce((total, n) => total * 60 + n, 0)
}

// "HH:MM:SS" + seconds → "HH:MM:SS", wrapping past midnight like the server's planned times.
export function addSeconds(time: string, seconds: number): string {
  const total = (parseDuration(time) + seconds) % 86_400
  const parts = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
  return parts.map((n) => String(n).padStart(2, '0')).join(':')
}
