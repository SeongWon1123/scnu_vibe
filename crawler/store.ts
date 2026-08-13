import type { SupabaseClient } from "@supabase/supabase-js"
import type { BoardConfig } from "./boards"
import type { NoticeRow } from "./parse"

export interface StoreResult {
  attempted: number
  stored: number
  error: string | null
}

interface NoticeInsert {
  board: string
  ntt_sn: number
  title: string
  author: string
  posted_at: string
  url: string
  is_pinned: boolean
}

export async function storeNoticeRows(
  board: BoardConfig,
  rows: NoticeRow[],
  writer: SupabaseClient,
): Promise<StoreResult> {
  if (rows.length === 0) {
    return { attempted: 0, stored: 0, error: null }
  }

  const notices: NoticeInsert[] = rows.map(row => ({
    board: board.key,
    ntt_sn: row.nttSn,
    title: row.title,
    author: row.author,
    posted_at: row.postedAt,
    url: row.url,
    is_pinned: row.isPinned,
  }))

  try {
    const { error } = await writer
      .from("notices")
      .upsert(notices, { onConflict: "board,ntt_sn" })

    if (error) {
      console.error(`[store] ${board.key}: ${error.message}`)
      return { attempted: notices.length, stored: 0, error: error.message }
    }

    return { attempted: notices.length, stored: notices.length, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    console.error(`[store] ${board.key}: ${message}`)
    return { attempted: notices.length, stored: 0, error: message }
  }
}