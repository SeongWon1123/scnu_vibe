function compact(dateISO: string): string {
  return dateISO.replaceAll("-", "")
}

function nextDay(dateISO: string): string {
  const date = new Date(`${dateISO}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

export function googleCalendarUrl(title: string, dateISO: string, noticeUrl: string): string {
  const dates = `${compact(dateISO)}/${compact(nextDay(dateISO))}`
  const details = `순모아에서 추가됨. 원문: ${noticeUrl}`
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${encodeURIComponent(dates)}` +
    `&details=${encodeURIComponent(details)}`
  )
}

export function buildIcs(title: string, dateISO: string, noticeUrl: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//sunmoa//ko",
    "BEGIN:VEVENT",
    `UID:${compact(dateISO)}-${encodeURIComponent(title).slice(0, 40)}@sunmoa`,
    `DTSTART;VALUE=DATE:${compact(dateISO)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(dateISO))}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:원문: ${noticeUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}
