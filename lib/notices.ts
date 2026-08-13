import { BOARDS, type BoardKey } from "@/crawler/boards"
import { supabaseAnon } from "./supabase"

export interface Notice {
  id: number
  board: string
  title: string
  author: string
  postedAt: string
  url: string
  isPinned: boolean
  deadline: string | null
  createdAt: string
}

export const BOARD_FILTERS: { key: BoardKey | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  ...BOARDS.map(board => ({ key: board.key, label: board.label })),
]

export const BOARD_CHIP_CLASS: Record<BoardKey, string> = {
  general: "bg-slate-100 text-slate-700",
  academic: "bg-blue-100 text-blue-800",
  scholarship: "bg-amber-100 text-amber-800",
  event: "bg-violet-100 text-violet-800",
  recruit: "bg-emerald-100 text-emerald-800",
  dorm: "bg-rose-100 text-rose-800",
}

export function isBoardKey(value: string | undefined): value is BoardKey {
  return BOARDS.some(board => board.key === value)
}

export function boardLabel(board: string): string {
  return BOARDS.find(item => item.key === board)?.label ?? board
}

export function dday(deadline: string, today: string): number {
  const ms =
    new Date(`${deadline}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()
  return Math.round(ms / 86_400_000)
}

export function todayKst(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })
}

export function isNewNotice(createdAt: string, now = new Date()): boolean {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  return now.getTime() - created < 24 * 60 * 60 * 1000
}

export function filterNotices(notices: Notice[], query: string): Notice[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return notices
  return notices.filter(notice => notice.title.toLowerCase().includes(needle))
}

function hasPublicSupabaseEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && key && !url.startsWith("YOUR_") && !key.startsWith("YOUR_"))
}

export async function fetchNotices(board?: BoardKey): Promise<Notice[]> {
  if (!hasPublicSupabaseEnv()) {
    return []
  }

  try {
    let query = supabaseAnon()
      .from("notices")
      .select("id, board, title, author, posted_at, url, is_pinned, deadline, created_at")
      .order("posted_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(50)

    if (board) query = query.eq("board", board)

    const { data, error } = await query
    if (error) {
      console.error(`[notices] ${error.message}`)
      return []
    }

    return (data ?? []).map(row => ({
      id: row.id,
      board: row.board,
      title: row.title,
      author: row.author,
      postedAt: row.posted_at,
      url: row.url,
      isPinned: row.is_pinned,
      deadline: row.deadline,
      createdAt: row.created_at,
    }))
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    console.error(`[notices] ${message}`)
    return []
  }
}
