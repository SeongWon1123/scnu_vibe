import { readFileSync } from "fs"
import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import { BOARDS } from "@/crawler/boards"
import { crawlAllBoards } from "@/crawler/run"

const academic = BOARDS.find(board => board.key === "academic")!
const fixture = readFileSync("tests/fixtures/list-academic.html", "utf-8")

function writerFor(result: unknown) {
  const upsert = vi.fn().mockResolvedValue(result)
  return {
    writer: { from: vi.fn().mockReturnValue({ upsert }) } as unknown as SupabaseClient,
    upsert,
  }
}

describe("crawlAllBoards", () => {
  it("fetches, parses, stores, and delays between boards", async () => {
    const { writer, upsert } = writerFor({ error: null })
    const fetchFn = vi.fn().mockImplementation(() => Promise.resolve(new Response(fixture)))
    const delay = vi.fn().mockResolvedValue(undefined)

    const results = await crawlAllBoards({
      boards: [academic, academic],
      writer,
      fetchFn: fetchFn as unknown as typeof fetch,
      delay,
      delayMs: 3_000,
    })

    expect(results).toHaveLength(2)
    expect(results.every(result => result.error === null)).toBe(true)
    expect(results[0].parsed).toBeGreaterThanOrEqual(5)
    expect(results[0].stored).toBe(results[0].parsed)
    expect(upsert).toHaveBeenCalledTimes(2)
    expect(delay).toHaveBeenCalledTimes(1)
    expect(delay).toHaveBeenCalledWith(3_000)
  })

  it("continues with the next board after a fetch failure", async () => {
    const { writer, upsert } = writerFor({ error: null })
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response("blocked", { status: 403 }))
      .mockResolvedValueOnce(new Response(fixture))

    const results = await crawlAllBoards({
      boards: [academic, academic],
      writer,
      fetchFn: fetchFn as unknown as typeof fetch,
      delay: vi.fn().mockResolvedValue(undefined),
    })

    expect(results[0]).toMatchObject({ parsed: 0, stored: 0, error: "fetch failed" })
    expect(results[1].parsed).toBeGreaterThanOrEqual(5)
    expect(results[1].stored).toBe(results[1].parsed)
    expect(upsert).toHaveBeenCalledTimes(1)
  })
})