import { BoardTabs, SearchForm } from "@/components/BoardTabs"
import { NoticeCard } from "@/components/NoticeCard"
import { fetchNotices, filterNotices, isBoardKey, todayKst } from "@/lib/notices"

export const revalidate = 1800

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams
  const boardParam = typeof params.board === "string" ? params.board : undefined
  const query = typeof params.q === "string" ? params.q : ""
  const board = isBoardKey(boardParam) ? boardParam : undefined
  const notices = filterNotices(await fetchNotices(board), query)
  const today = todayKst()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <BoardTabs active={board} query={query} />
      <SearchForm board={board} query={query} />
      {notices.length === 0 ? (
        <p className="mt-10 text-center text-sm leading-6 text-zinc-500">
          아직 수집된 공지가 없어요.
          <br />
          크롤이 한 번 돌면 학사·장학·생활관 공지가 여기에 모여요.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {notices.map(notice => (
            <li key={notice.id}>
              <NoticeCard notice={notice} today={today} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
