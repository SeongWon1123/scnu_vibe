import { describe, expect, it } from "vitest"
import { selectNew } from "@/crawler/diff"
import type { NoticeRow } from "@/crawler/parse"

function row(nttSn: number): NoticeRow {
  return {
    nttSn,
    title: `t${nttSn}`,
    author: "a",
    postedAt: "2026-08-12",
    isPinned: false,
    url: `u${nttSn}`,
  }
}

describe("selectNew", () => {
  it("keeps only rows whose nttSn is not already known", () => {
    const rows = [row(1), row(2), row(3)]
    expect(selectNew(rows, new Set([1, 3])).map(item => item.nttSn)).toEqual([2])
  })

  it("returns all rows when nothing is known (first run)", () => {
    expect(selectNew([row(1), row(2)], new Set())).toHaveLength(2)
  })

  it("returns an empty array when everything is known", () => {
    expect(selectNew([row(1)], new Set([1]))).toEqual([])
  })
})
