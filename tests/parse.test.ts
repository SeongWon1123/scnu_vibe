import { readFileSync } from "fs"
import { describe, expect, it } from "vitest"
import { BOARDS } from "@/crawler/boards"
import { parseNoticeList } from "@/crawler/parse"

const academic = BOARDS.find(board => board.key === "academic")!
const fixture = readFileSync("tests/fixtures/list-academic.html", "utf-8")
const invalid = readFileSync("tests/fixtures/list-invalid.html", "utf-8")

describe("parseNoticeList", () => {
  it("extracts valid notice rows from the real academic fixture", () => {
    const rows = parseNoticeList(fixture, academic)

    expect(rows.length).toBeGreaterThanOrEqual(5)
    for (const row of rows) {
      expect(row.nttSn).toBeGreaterThan(0)
      expect(row.title.length).toBeGreaterThan(0)
      expect(row.title).not.toMatch(/^\s*\uACF5\uC9C0\s*/)
      expect(row.postedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(row.url).toMatch(
        /^https:\/\/www\.scnu\.ac\.kr\/SCNU\/na\/ntt\/selectNttInfo\.do\?nttSn=\d+&mi=1132$/,
      )
    }
  })

  it("marks pinned rows and trims author whitespace", () => {
    const rows = parseNoticeList(fixture, academic)
    const pinnedRows = rows.filter(row => row.isPinned)

    expect(pinnedRows.length).toBeGreaterThanOrEqual(1)
    for (const row of rows) {
      expect(row.author).toBe(row.author.trim())
    }
  })

  it("returns an empty array for the invalid-request page", () => {
    expect(parseNoticeList(invalid, academic)).toEqual([])
  })

  it("returns an empty array for empty or unrelated HTML", () => {
    expect(parseNoticeList("", academic)).toEqual([])
    expect(parseNoticeList("<main>no notice table</main>", academic)).toEqual([])
  })
})