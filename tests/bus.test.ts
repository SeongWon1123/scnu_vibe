import { describe, expect, it } from "vitest"
import { nextDeparture } from "@/lib/bus"

const times = ["08:00", "12:30", "17:30"]

describe("nextDeparture", () => {
  it("returns the next remaining departure today", () => {
    const now = new Date("2026-08-12T11:00:00+09:00")
    expect(nextDeparture(times, now)).toEqual({ time: "12:30", minutesLeft: 90 })
  })

  it("returns the first bus when called before service starts", () => {
    const now = new Date("2026-08-12T06:00:00+09:00")
    expect(nextDeparture(times, now)?.time).toBe("08:00")
  })

  it("returns null after the last bus", () => {
    const now = new Date("2026-08-12T20:00:00+09:00")
    expect(nextDeparture(times, now)).toBeNull()
  })

  it("returns null for an empty timetable", () => {
    expect(nextDeparture([], new Date())).toBeNull()
  })
})
