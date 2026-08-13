import type { SupabaseClient } from "@supabase/supabase-js"
import { BOARDS, type BoardConfig } from "./boards"
import { DELAY_MS, fetchBoardHtml, sleep } from "./fetch"
import { parseNoticeList } from "./parse"
import { storeNoticeRows } from "./store"

export interface CrawlBoardResult {
  board: BoardConfig["key"]
  parsed: number
  stored: number
  error: string | null
}

export interface CrawlOptions {
  boards?: readonly BoardConfig[]
  writer: SupabaseClient
  fetchFn?: typeof fetch
  delay?: (ms: number) => Promise<void>
  delayMs?: number
}

export async function crawlAllBoards(options: CrawlOptions): Promise<CrawlBoardResult[]> {
  const boards = options.boards ?? BOARDS
  const delay = options.delay ?? sleep
  const delayMs = options.delayMs ?? DELAY_MS
  const results: CrawlBoardResult[] = []

  for (const [index, board] of boards.entries()) {
    const html = await fetchBoardHtml(board, options.fetchFn)

    if (html === null) {
      results.push({ board: board.key, parsed: 0, stored: 0, error: "fetch failed" })
    } else {
      const rows = parseNoticeList(html, board)
      const storeResult = await storeNoticeRows(board, rows, options.writer)
      results.push({
        board: board.key,
        parsed: rows.length,
        stored: storeResult.stored,
        error: storeResult.error,
      })
    }

    if (index < boards.length - 1) {
      await delay(delayMs)
    }
  }

  return results
}