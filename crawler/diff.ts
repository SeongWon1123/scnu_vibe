import type { NoticeRow } from "./parse"

export function selectNew(rows: NoticeRow[], knownSns: Set<number>): NoticeRow[] {
  return rows.filter(row => !knownSns.has(row.nttSn))
}
