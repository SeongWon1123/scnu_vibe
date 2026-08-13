const FULL = /(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/g
const SHORT = /(?<!\d[.\-/]\s?)(\d{1,2})\s*[.월]\s*(\d{1,2})\s*일?/g

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

export function extractDeadline(title: string, postedAt: string): string | null {
  if (!/[~∼]|까지/.test(title)) return null

  const posted = new Date(`${postedAt}T00:00:00`)
  const dates: Date[] = []

  for (const match of title.matchAll(FULL)) {
    dates.push(new Date(`${match[1]}-${pad(+match[2])}-${pad(+match[3])}T00:00:00`))
  }

  // Strip full dates first so "2026. 8. 13." is not also parsed as "8. 13.".
  const remainder = title.replace(FULL, " ")
  for (const match of remainder.matchAll(SHORT)) {
    const month = +match[1]
    const day = +match[2]
    if (month < 1 || month > 12 || day < 1 || day > 31) continue

    let date = new Date(`${posted.getFullYear()}-${pad(month)}-${pad(day)}T00:00:00`)
    // A deadline far in the past relative to posting means next year (Dec -> Jan).
    if (posted.getTime() - date.getTime() > 180 * 24 * 3600 * 1000) {
      date = new Date(`${posted.getFullYear() + 1}-${pad(month)}-${pad(day)}T00:00:00`)
    }
    dates.push(date)
  }

  if (dates.length === 0) return null
  const last = dates[dates.length - 1]
  if (Number.isNaN(last.getTime())) return null
  return `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`
}
