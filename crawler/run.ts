import type { SupabaseClient } from "@supabase/supabase-js"
import { BOARDS, type BoardConfig } from "./boards"
import { DELAY_MS, fetchBoardHtml, sleep } from "./fetch"
import { parseNoticeList } from "./parse"
import { storeNoticeRows, type InsertedNotice } from "./store"

export interface CrawlBoardResult {
  board: BoardConfig["key"]
  parsed: number
  stored: number
  error: string | null
  inserted: InsertedNotice[]
}

export interface CrawlOptions {
  boards?: readonly BoardConfig[]
  writer: SupabaseClient
  fetchFn?: typeof fetch
  delay?: (ms: number) => Promise<void>
  delayMs?: number
}

const EMPTY_PARSE_ERROR = "parsed 0 rows (layout change?)"

export async function crawlAllBoards(options: CrawlOptions): Promise<CrawlBoardResult[]> {
  const boards = options.boards ?? BOARDS
  const delay = options.delay ?? sleep
  const delayMs = options.delayMs ?? DELAY_MS
  const results: CrawlBoardResult[] = []

  for (const [index, board] of boards.entries()) {
    const html = await fetchBoardHtml(board, options.fetchFn)

    if (html === null) {
      results.push({
        board: board.key,
        parsed: 0,
        stored: 0,
        error: "fetch failed",
        inserted: [],
      })
    } else {
      const rows = parseNoticeList(html, board)
      if (rows.length === 0) {
        console.error(`[crawl] ${board.key}: ${EMPTY_PARSE_ERROR}`)
        results.push({
          board: board.key,
          parsed: 0,
          stored: 0,
          error: EMPTY_PARSE_ERROR,
          inserted: [],
        })
      } else {
        const storeResult = await storeNoticeRows(board, rows, options.writer)
        if (storeResult.stored === 0 && storeResult.error === null) {
          console.log(`[crawl] ${board.key}: no new notices`)
        }
        results.push({
          board: board.key,
          parsed: rows.length,
          stored: storeResult.stored,
          error: storeResult.error,
          inserted: storeResult.inserted,
        })
      }
    }

    if (index < boards.length - 1) {
      await delay(delayMs)
    }
  }

  return results
}
