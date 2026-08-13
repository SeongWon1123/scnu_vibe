import { describe, expect, it, vi } from "vitest"
import { BOARDS, listUrl } from "@/crawler/boards"
import { DELAY_MS, fetchBoardHtml, USER_AGENT } from "@/crawler/fetch"

const board = BOARDS[0]

describe("fetchBoardHtml", () => {
  it("requests a board list URL with the identifiable bot user agent", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("<html>ok</html>"))

    const html = await fetchBoardHtml(board, fetchFn as unknown as typeof fetch)

    expect(html).toBe("<html>ok</html>")
    expect(fetchFn).toHaveBeenCalledWith(listUrl(board), {
      headers: { "User-Agent": USER_AGENT },
    })
  })

  it("returns null for an HTTP error without throwing", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("blocked", { status: 403 }))

    await expect(fetchBoardHtml(board, fetchFn as unknown as typeof fetch)).resolves.toBeNull()
  })

  it("returns null for a network error without throwing", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("ECONNRESET"))

    await expect(fetchBoardHtml(board, fetchFn as unknown as typeof fetch)).resolves.toBeNull()
  })

  it("returns null when a successful response body cannot be read", async () => {
    const response = {
      ok: true,
      status: 200,
      text: vi.fn().mockRejectedValue(new Error("body read failed")),
    } as unknown as Response
    const fetchFn = vi.fn().mockResolvedValue(response)

    await expect(fetchBoardHtml(board, fetchFn as unknown as typeof fetch)).resolves.toBeNull()
  })

  it("declares a three-second minimum delay and public contact", () => {
    expect(DELAY_MS).toBeGreaterThanOrEqual(3_000)
    expect(USER_AGENT).toContain("SunmoaBot")
    expect(USER_AGENT).toContain("contact")
    expect(USER_AGENT).toContain("github.com/SeongWon1123/scnu_vibe")
  })
})