import { describe, expect, it } from "vitest"
import { extractDeadline } from "@/lib/deadline"

describe("extractDeadline", () => {
  it("extracts a full date after a tilde range", () => {
    expect(extractDeadline("2026-2학기 국가장학금 신청 안내(~2026. 8. 13.)", "2026-07-28")).toBe(
      "2026-08-13",
    )
  })

  it("extracts a short date with 까지, inferring year from postedAt", () => {
    expect(extractDeadline("셔틀 신청 8. 13.(목)까지", "2026-07-28")).toBe("2026-08-13")
  })

  it("handles the Korean month/day format", () => {
    expect(extractDeadline("수강 정정 8월 13일까지 접수", "2026-08-01")).toBe("2026-08-13")
  })

  it("takes the last date of a range", () => {
    expect(extractDeadline("신청기간: 8. 7. ~ 8. 13.", "2026-08-01")).toBe("2026-08-13")
  })

  it("rolls the year forward for a January deadline posted in December", () => {
    expect(extractDeadline("동계 근로 신청 ~1. 10.", "2026-12-20")).toBe("2027-01-10")
  })

  it("returns null when no range marker exists", () => {
    expect(extractDeadline("2026학년도 입학식 8. 20. 개최", "2026-08-01")).toBeNull()
  })

  it("returns null when no date exists", () => {
    expect(extractDeadline("생활관 소음 관련 안내", "2026-08-01")).toBeNull()
  })
})
