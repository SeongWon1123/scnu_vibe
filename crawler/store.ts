import type { SupabaseClient } from "@supabase/supabase-js"
import { extractDeadline } from "../lib/deadline"
import type { BoardConfig } from "./boards"
import { selectNew } from "./diff"
import type { NoticeRow } from "./parse"

export interface InsertedNotice {
  board: string
  nttSn: number
  title: string
  url: string
}

export interface StoreResult {
  attempted: number
  stored: number
  error: string | null
  inserted: InsertedNotice[]
}

interface NoticeInsert {
  board: string
  ntt_sn: number
  title: string
  author: string
  posted_at: string
  url: string
  is_pinned: boolean
  deadline: string | null
}

function emptyResult(): StoreResult {
  return { attempted: 0, stored: 0, error: null, inserted: [] }
}

function toInsert(board: BoardConfig, row: NoticeRow): NoticeInsert {
  return {
    board: board.key,
    ntt_sn: row.nttSn,
    title: row.title,
    author: row.author,
    posted_at: row.postedAt,
    url: row.url,
    is_pinned: row.isPinned,
    deadline: extractDeadline(row.title, row.postedAt),
  }
}

function toInserted(board: BoardConfig, row: NoticeRow): InsertedNotice {
  return {
    board: board.key,
    nttSn: row.nttSn,
    title: row.title,
    url: row.url,
  }
}

export async function storeNoticeRows(
  board: BoardConfig,
  rows: NoticeRow[],
  writer: SupabaseClient,
): Promise<StoreResult> {
  if (rows.length === 0) {
    return emptyResult()
  }

  try {
    const { data: known, error: selectError } = await writer
      .from("notices")
      .select("ntt_sn")
      .eq("board", board.key)
      .in(
        "ntt_sn",
        rows.map(row => row.nttSn),
      )

    if (selectError) {
      console.error(`[store] ${board.key}: ${selectError.message}`)
      return { attempted: rows.length, stored: 0, error: selectError.message, inserted: [] }
    }

    const fresh = selectNew(
      rows,
      new Set((known ?? []).map(item => Number(item.ntt_sn))),
    )
    if (fresh.length === 0) {
      return emptyResult()
    }

    const notices = fresh.map(row => toInsert(board, row))
    const { error } = await writer.from("notices").upsert(notices, {
      onConflict: "board,ntt_sn",
      ignoreDuplicates: true,
    })

    if (error) {
      console.error(`[store] ${board.key}: ${error.message}`)
      return { attempted: notices.length, stored: 0, error: error.message, inserted: [] }
    }

    return {
      attempted: notices.length,
      stored: notices.length,
      error: null,
      inserted: fresh.map(row => toInserted(board, row)),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    console.error(`[store] ${board.key}: ${message}`)
    return { attempted: rows.length, stored: 0, error: message, inserted: [] }
  }
}
