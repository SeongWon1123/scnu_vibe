import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import { BOARDS } from "@/crawler/boards"
import type { NoticeRow } from "@/crawler/parse"
import { storeNoticeRows } from "@/crawler/store"

const academic = BOARDS.find(board => board.key === "academic")!
const row: NoticeRow = {
  nttSn: 123,
  title: "Scholarship notice",
  author: "Student Affairs",
  postedAt: "2026-08-13",
  isPinned: true,
  url: "https://www.scnu.ac.kr/SCNU/na/ntt/selectNttInfo.do?nttSn=123&mi=1132",
}

function writerFor(result: unknown) {
  const upsert = vi.fn().mockResolvedValue(result)
  const from = vi.fn().mockReturnValue({ upsert })
  return { writer: { from } as unknown as SupabaseClient, from, upsert }
}

describe("storeNoticeRows", () => {
  it("maps parsed rows and upserts by board plus school notice id", async () => {
    const { writer, from, upsert } = writerFor({ error: null })

    const result = await storeNoticeRows(academic, [row], writer)

    expect(result).toEqual({ attempted: 1, stored: 1, error: null })
    expect(from).toHaveBeenCalledWith("notices")
    expect(upsert).toHaveBeenCalledWith(
      [
        {
          board: "academic",
          ntt_sn: 123,
          title: "Scholarship notice",
          author: "Student Affairs",
          posted_at: "2026-08-13",
          url: row.url,
          is_pinned: true,
        },
      ],
      { onConflict: "board,ntt_sn" },
    )
  })

  it("does not contact Supabase when there are no parsed rows", async () => {
    const { writer, from } = writerFor({ error: null })

    await expect(storeNoticeRows(academic, [], writer)).resolves.toEqual({
      attempted: 0,
      stored: 0,
      error: null,
    })
    expect(from).not.toHaveBeenCalled()
  })

  it("returns a database error without throwing", async () => {
    const { writer } = writerFor({ error: { message: "permission denied" } })

    await expect(storeNoticeRows(academic, [row], writer)).resolves.toEqual({
      attempted: 1,
      stored: 0,
      error: "permission denied",
    })
  })

  it("returns a transport failure without throwing", async () => {
    const upsert = vi.fn().mockRejectedValue(new Error("connection reset"))
    const writer = {
      from: vi.fn().mockReturnValue({ upsert }),
    } as unknown as SupabaseClient

    await expect(storeNoticeRows(academic, [row], writer)).resolves.toEqual({
      attempted: 1,
      stored: 0,
      error: "connection reset",
    })
  })
})