const SECONDS_PER_DAY = 24 * 60 * 60

export function timeToSeconds(time: string): number {
  const [hours = 0, minutes = 0, seconds = 0] = time.split(':').map(Number)
  return hours * 3600 + minutes * 60 + seconds
}

// Wraps past midnight: a show running over 24:00 continues at 00:00.
export function secondsToTime(total: number): string {
  const wrapped = ((Math.floor(total) % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY
  const hours = Math.floor(wrapped / 3600)
  const minutes = Math.floor((wrapped % 3600) / 60)
  const seconds = wrapped % 60
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':')
}
