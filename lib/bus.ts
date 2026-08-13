export interface BusRoute {
  id: string
  name: string
  toSchool: string[]
  fromSchool: string[]
  stops: string[]
  notes: string
}

export interface BusSchedules {
  updatedAt: string
  source: string
  reservationUrl: string
  routes: BusRoute[]
}

function kstMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const hour = Number(parts.find(part => part.type === "hour")?.value ?? "0")
  const minute = Number(parts.find(part => part.type === "minute")?.value ?? "0")
  return hour * 60 + minute
}

// times are 'HH:MM' in KST; `now` is compared in KST regardless of server TZ.
export function nextDeparture(
  times: string[],
  now: Date,
): { time: string; minutesLeft: number } | null {
  const nowMin = kstMinutes(now)
  for (const time of [...times].sort()) {
    const [hour, minute] = time.split(":").map(Number)
    const departure = hour * 60 + minute
    if (departure >= nowMin) return { time, minutesLeft: departure - nowMin }
  }
  return null
}
