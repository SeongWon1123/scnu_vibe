import { describe, expect, it } from "vitest"
import { matchesAny, normalizeKeywords } from "@/lib/keywords"

describe("normalizeKeywords", () => {
  it("splits on commas and whitespace, trims, dedupes", () => {
    expect(normalizeKeywords("장학, 기숙사 장학  셔틀")).toEqual(["장학", "기숙사", "셔틀"])
  })

  it("caps at 10 keywords and drops empty/oversized entries", () => {
    const raw = Array.from({ length: 15 }, (_, i) => `k${i}`).join(",") + ",," + "x".repeat(30)
    const out = normalizeKeywords(raw)
    expect(out).toHaveLength(10)
    expect(out.every(keyword => keyword.length >= 1 && keyword.length <= 20)).toBe(true)
  })
})

describe("matchesAny", () => {
  it("matches case-insensitive substrings", () => {
    expect(matchesAny("2026-2학기 국가장학금 신청 안내", ["장학"])).toBe(true)
    expect(matchesAny("SW중심대학 특강", ["sw"])).toBe(true)
  })

  it("returns false when nothing matches or keywords empty", () => {
    expect(matchesAny("수강신청 안내", ["기숙사"])).toBe(false)
    expect(matchesAny("수강신청 안내", [])).toBe(false)
  })
})
