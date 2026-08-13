import { describe, expect, it } from "vitest"
import { dday, fetchNotices, filterNotices, isNewNotice, type Notice } from "@/lib/notices"

describe("dday", () => {
  it("is 0 on the deadline day", () => {
    expect(dday("2026-08-13", "2026-08-13")).toBe(0)
  })

  it("is positive before the deadline", () => {
    expect(dday("2026-08-13", "2026-08-10")).toBe(3)
  })

  it("is negative after the deadline", () => {
    expect(dday("2026-08-13", "2026-08-15")).toBe(-2)
  })
})

describe("isNewNotice", () => {
  it("is true within 24 hours of crawl time", () => {
    expect(isNewNotice("2026-08-13T08:00:00.000Z", new Date("2026-08-13T20:00:00.000Z"))).toBe(
      true,
    )
  })

  it("is false after 24 hours", () => {
    expect(isNewNotice("2026-08-12T07:00:00.000Z", new Date("2026-08-13T08:00:00.000Z"))).toBe(
      false,
    )
  })
})

describe("filterNotices", () => {
  const notices: Notice[] = [
    {
      id: 1,
      board: "scholarship",
      title: "국가장학금 신청 안내",
      author: "학생과",
      postedAt: "2026-08-13",
      url: "https://example.com/1",
      isPinned: false,
      deadline: "2026-08-20",
      createdAt: "2026-08-13T00:00:00.000Z",
    },
    {
      id: 2,
      board: "academic",
      title: "수강신청 일정",
      author: "교무과",
      postedAt: "2026-08-12",
      url: "https://example.com/2",
      isPinned: false,
      deadline: null,
      createdAt: "2026-08-12T00:00:00.000Z",
    },
  ]

  it("filters by title substring", () => {
    expect(filterNotices(notices, "장학").map(notice => notice.id)).toEqual([1])
  })

  it("returns all notices when the query is empty", () => {
    expect(filterNotices(notices, "  ")).toHaveLength(2)
  })
})

describe("fetchNotices", () => {
  it("returns an empty list when public Supabase env is not configured", async () => {
    await expect(fetchNotices()).resolves.toEqual([])
  })
})
