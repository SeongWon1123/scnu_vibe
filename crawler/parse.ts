import { parse } from "node-html-parser"
import { detailUrl, type BoardConfig } from "./boards"

export interface NoticeRow {
  nttSn: number
  title: string
  author: string
  postedAt: string
  isPinned: boolean
  url: string
}

const INVALID_REQUEST = "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC694\uCCAD"

export function parseNoticeList(html: string, board: BoardConfig): NoticeRow[] {
  if (!html || html.includes(INVALID_REQUEST)) {
    return []
  }

  try {
    const root = parse(html)
    const rows: NoticeRow[] = []

    for (const tableRow of root.querySelectorAll("table tbody tr")) {
      const link = tableRow.querySelector("td.ta_l a")
      if (!link) continue

      const href = link.getAttribute("href") ?? ""
      const serialMatch = href.match(/[?&]nttSn=(\d+)/)
      if (!serialMatch) continue

      const nttSn = Number(serialMatch[1])
      if (!Number.isSafeInteger(nttSn) || nttSn <= 0) continue

      const isPinned = link.querySelector("b.btn_S.btn_red") !== null
      for (const badge of link.querySelectorAll("b")) {
        badge.remove()
      }

      const title = link.text.replace(/\s+/g, " ").trim()
      if (!title) continue

      const author = (tableRow.querySelector("td.BD_listUser")?.text ?? "").trim()
      const dateMatch = tableRow.text.match(/(\d{4})\.\s*(\d{2})\.\s*(\d{2})/)
      if (!dateMatch) continue

      rows.push({
        nttSn,
        title,
        author,
        postedAt: dateMatch[1] + "-" + dateMatch[2] + "-" + dateMatch[3],
        isPinned,
        url: detailUrl(board, nttSn),
      })
    }

    return rows
  } catch {
    return []
  }
}