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

function writerFor(options?: {
  known?: number[]
  selectError?: { message: string }
  upsertError?: { message: string } | null
  upsertReject?: Error
}) {
  const inFn = vi.fn().mockResolvedValue(
    options?.selectError
      ? { data: null, error: options.selectError }
      : {
          data: (options?.known ?? []).map(ntt_sn => ({ ntt_sn })),
          error: null,
        },
  )
  const eq = vi.fn().mockReturnValue({ in: inFn })
  const select = vi.fn().mockReturnValue({ eq })
  const upsert = options?.upsertReject
    ? vi.fn().mockRejectedValue(options.upsertReject)
    : vi.fn().mockResolvedValue({ error: options?.upsertError ?? null })
  const from = vi.fn().mockReturnValue({ select, upsert })
  return {
    writer: { from } as unknown as SupabaseClient,
    from,
    select,
    inFn,
    upsert,
  }
}

describe("storeNoticeRows", () => {
  it("inserts only unseen rows with extracted deadlines", async () => {
    const deadlineRow: NoticeRow = {
      ...row,
      nttSn: 456,
      title: "국가장학금 신청 안내(~2026. 8. 13.)",
    }
    const { writer, from, upsert } = writerFor({ known: [123] })

    const result = await storeNoticeRows(academic, [row, deadlineRow], writer)

    expect(result).toEqual({
      attempted: 1,
      stored: 1,
      error: null,
      inserted: [
        {
          board: "academic",
          nttSn: 456,
          title: deadlineRow.title,
          url: deadlineRow.url,
        },
      ],
    })
    expect(from).toHaveBeenCalledWith("notices")
    expect(upsert).toHaveBeenCalledWith(
      [
        {
          board: "academic",
          ntt_sn: 456,
          title: deadlineRow.title,
          author: "Student Affairs",
          posted_at: "2026-08-13",
          url: deadlineRow.url,
          is_pinned: true,
          deadline: "2026-08-13",
        },
      ],
      { onConflict: "board,ntt_sn", ignoreDuplicates: true },
    )
  })

  it("does not contact Supabase when there are no parsed rows", async () => {
    const { writer, from } = writerFor()

    await expect(storeNoticeRows(academic, [], writer)).resolves.toEqual({
      attempted: 0,
      stored: 0,
      error: null,
      inserted: [],
    })
    expect(from).not.toHaveBeenCalled()
  })

  it("skips the write when every notice is already stored", async () => {
    const { writer, upsert } = writerFor({ known: [123] })

    await expect(storeNoticeRows(academic, [row], writer)).resolves.toEqual({
      attempted: 0,
      stored: 0,
      error: null,
      inserted: [],
    })
    expect(upsert).not.toHaveBeenCalled()
  })

  it("returns a select error without writing", async () => {
    const { writer, upsert } = writerFor({ selectError: { message: "permission denied" } })

    await expect(storeNoticeRows(academic, [row], writer)).resolves.toEqual({
      attempted: 1,
      stored: 0,
      error: "permission denied",
      inserted: [],
    })
    expect(upsert).not.toHaveBeenCalled()
  })

  it("returns a database error without throwing", async () => {
    const { writer } = writerFor({ upsertError: { message: "permission denied" } })

    await expect(storeNoticeRows(academic, [row], writer)).resolves.toEqual({
      attempted: 1,
      stored: 0,
      error: "permission denied",
      inserted: [],
    })
  })

  it("returns a transport failure without throwing", async () => {
    const { writer } = writerFor({ upsertReject: new Error("connection reset") })

    await expect(storeNoticeRows(academic, [row], writer)).resolves.toEqual({
      attempted: 1,
      stored: 0,
      error: "connection reset",
      inserted: [],
    })
  })
})
