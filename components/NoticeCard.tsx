import { googleCalendarUrl } from "@/lib/calendar"
import {
  BOARD_CHIP_CLASS,
  boardLabel,
  dday,
  isBoardKey,
  isNewNotice,
  type Notice,
} from "@/lib/notices"

function ddayLabel(days: number): string {
  if (days === 0) return "D-Day"
  if (days > 0) return `D-${days}`
  return "마감"
}

export function NoticeCard({ notice, today }: { notice: Notice; today: string }) {
  const chipClass = isBoardKey(notice.board)
    ? BOARD_CHIP_CLASS[notice.board]
    : "bg-zinc-100 text-zinc-700"
  const days = notice.deadline ? dday(notice.deadline, today) : null
  const urgent = days !== null && days >= 0 && days <= 3
  const showCalendar = days !== null && days >= 0
  const fresh = isNewNotice(notice.createdAt)

  return (
    <article className="relative rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-200/80">
      <a
        aria-label={`${notice.title} 원문 보기`}
        className="absolute inset-0 rounded-2xl"
        href={notice.url}
        rel="noopener noreferrer"
        target="_blank"
      />
      <div className="relative flex flex-wrap items-center gap-1.5 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${chipClass}`}>
          {boardLabel(notice.board)}
        </span>
        <time className="text-zinc-500" dateTime={notice.postedAt}>
          {notice.postedAt.replaceAll("-", ".")}
        </time>
        {fresh ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
            NEW
          </span>
        ) : null}
        {notice.isPinned ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
            고정
          </span>
        ) : null}
      </div>
      <h2 className="relative mt-2 line-clamp-2 text-[16px] font-semibold leading-snug tracking-tight text-zinc-900">
        {notice.title}
      </h2>
      {notice.author ? (
        <p className="relative mt-1 text-xs text-zinc-500">{notice.author}</p>
      ) : null}
      {days !== null ? (
        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2">
          <span
            className={
              urgent
                ? "rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white"
                : "rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600"
            }
          >
            {ddayLabel(days)}
          </span>
          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">
            자동 인식
          </span>
          {showCalendar ? (
            <>
              <a
                className="rounded-md px-1.5 py-0.5 text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
                href={googleCalendarUrl(notice.title, notice.deadline!, notice.url)}
                rel="noopener noreferrer"
                target="_blank"
              >
                캘린더에 추가
              </a>
              <a
                className="rounded-md px-1.5 py-0.5 text-xs font-medium text-zinc-600 underline-offset-2 hover:underline"
                href={`/api/ics?title=${encodeURIComponent(notice.title)}&date=${notice.deadline}&url=${encodeURIComponent(notice.url)}`}
              >
                iOS
              </a>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
