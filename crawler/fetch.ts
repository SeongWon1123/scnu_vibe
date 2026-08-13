import { listUrl, type BoardConfig } from "./boards"

export const USER_AGENT =
  "SunmoaBot/1.0 (+https://github.com/SeongWon1123/scnu_vibe; contact: https://github.com/SeongWon1123/scnu_vibe/issues)"

export const DELAY_MS = 3_000

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchBoardHtml(
  board: BoardConfig,
  fetchFn: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const response = await fetchFn(listUrl(board), {
      headers: { "User-Agent": USER_AGENT },
    })

    if (!response.ok) {
      console.error(`[fetch] ${board.key}: HTTP ${response.status}`)
      return null
    }

    return await response.text()
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    console.error(`[fetch] ${board.key}: ${message}`)
    return null
  }
}