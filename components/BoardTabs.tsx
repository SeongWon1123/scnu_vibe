import Link from "next/link"
import { BOARD_FILTERS } from "@/lib/notices"
import type { BoardKey } from "@/crawler/boards"

function hrefFor(board: BoardKey | "all", query: string): string {
  const params = new URLSearchParams()
  if (board !== "all") params.set("board", board)
  if (query) params.set("q", query)
  const search = params.toString()
  return search ? `/?${search}` : "/"
}

export function BoardTabs({
  active,
  query,
}: {
  active?: BoardKey
  query: string
}) {
  const current = active ?? "all"

  return (
    <nav aria-label="게시판 필터" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex w-max gap-2 pb-1">
        {BOARD_FILTERS.map(tab => {
          const selected = tab.key === current
          return (
            <li key={tab.key}>
              <Link
                className={
                  selected
                    ? "inline-flex rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
                    : "inline-flex rounded-full bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100"
                }
                href={hrefFor(tab.key, query)}
                scroll={false}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function SearchForm({
  board,
  query,
}: {
  board?: BoardKey
  query: string
}) {
  return (
    <form action="/" className="mt-3" method="get">
      {board ? <input name="board" type="hidden" value={board} /> : null}
      <label className="sr-only" htmlFor="notice-search">
        공지 제목 검색
      </label>
      <input
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-zinc-900 placeholder:text-zinc-400 focus:ring-2"
        defaultValue={query}
        id="notice-search"
        name="q"
        placeholder="제목 검색 (장학, 기숙사…)"
        type="search"
      />
    </form>
  )
}
