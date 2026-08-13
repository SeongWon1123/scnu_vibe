export type BoardKey =
  | "general"
  | "academic"
  | "scholarship"
  | "event"
  | "recruit"
  | "dorm"

export interface BoardConfig {
  key: BoardKey
  label: string
  site: "SCNU" | "dorm"
  mi: number
  bbsId: number
}

export const BASE = "https://www.scnu.ac.kr"

// Verified 2026-08-13. Both mi and bbsId are required for list pages.
// The detail URL is canonicalized with nttSn and mi only.
export const BOARDS: BoardConfig[] = [
  { key: "general", label: "\uACF5\uC9C0", site: "SCNU", mi: 1131, bbsId: 1040 },
  { key: "academic", label: "\uD559\uC0AC", site: "SCNU", mi: 1132, bbsId: 1041 },
  { key: "scholarship", label: "\uC7A5\uD559", site: "SCNU", mi: 8690, bbsId: 4487 },
  { key: "event", label: "\uAD50\uB0B4\uD589\uC0AC", site: "SCNU", mi: 1188, bbsId: 1067 },
  { key: "recruit", label: "\uBAA8\uC9D1\u00B7\uCC44\uC6A9", site: "SCNU", mi: 1189, bbsId: 1068 },
  { key: "dorm", label: "\uC0DD\uD65C\uAD00", site: "dorm", mi: 1337, bbsId: 1126 },
]

export function listUrl(board: BoardConfig): string {
  return (
    BASE +
    "/" +
    board.site +
    "/na/ntt/selectNttList.do?mi=" +
    board.mi +
    "&bbsId=" +
    board.bbsId
  )
}

export function detailUrl(board: BoardConfig, nttSn: number): string {
  return (
    BASE +
    "/" +
    board.site +
    "/na/ntt/selectNttInfo.do?nttSn=" +
    nttSn +
    "&mi=" +
    board.mi
  )
}