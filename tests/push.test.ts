import { describe, expect, it } from "vitest"
import { planPushes, type Sub } from "@/crawler/push"
import type { InsertedNotice } from "@/crawler/store"

const notice = (title: string, nttSn = 1): InsertedNotice => ({
  board: "academic",
  nttSn,
  title,
  url: "u",
})
const sub = (keywords: string[]): Sub => ({
  endpoint: "e" + keywords.join(""),
  p256dh: "p",
  auth: "a",
  keywords,
})

describe("planPushes", () => {
  it("pairs subscribers with notices matching their keywords", () => {
    const plan = planPushes([notice("국가장학금 신청"), notice("수강신청 일정")], [sub(["장학"])])
    expect(plan).toHaveLength(1)
    expect(plan[0].notice.title).toBe("국가장학금 신청")
  })

  it("caps at 3 notifications per subscriber per run", () => {
    const notices = ["장학A", "장학B", "장학C", "장학D"].map((title, index) =>
      notice(title, index + 1),
    )
    expect(planPushes(notices, [sub(["장학"])])).toHaveLength(3)
  })

  it("returns [] when there are no matches", () => {
    expect(planPushes([notice("수강신청")], [sub(["기숙사"])])).toEqual([])
  })
})
