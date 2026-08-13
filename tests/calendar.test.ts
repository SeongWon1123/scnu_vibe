import { describe, expect, it } from "vitest"
import { buildIcs, googleCalendarUrl } from "@/lib/calendar"

describe("googleCalendarUrl", () => {
  it("builds an all-day event url (end date exclusive, +1 day)", () => {
    const url = googleCalendarUrl("장학금 신청 마감", "2026-08-13", "https://scnu.ac.kr/x")
    expect(url).toContain("https://calendar.google.com/calendar/render?action=TEMPLATE")
    expect(url).toContain("dates=20260813%2F20260814")
    expect(url).toContain(encodeURIComponent("장학금 신청 마감"))
    expect(url).toContain(encodeURIComponent("https://scnu.ac.kr/x"))
  })
})

describe("buildIcs", () => {
  it("produces a valid all-day VEVENT", () => {
    const ics = buildIcs("장학금 신청 마감", "2026-08-13", "https://scnu.ac.kr/x")
    expect(ics).toContain("BEGIN:VCALENDAR")
    expect(ics).toContain("DTSTART;VALUE=DATE:20260813")
    expect(ics).toContain("DTEND;VALUE=DATE:20260814")
    expect(ics).toContain("SUMMARY:장학금 신청 마감")
    expect(ics).toContain("END:VCALENDAR")
  })
})
