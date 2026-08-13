"use client"

import { useEffect, useMemo, useState } from "react"
import { nextDeparture, type BusRoute } from "@/lib/bus"

type Direction = "toSchool" | "fromSchool"

export function RouteCard({
  route,
  source,
  reservationUrl,
}: {
  route: BusRoute
  source: string
  reservationUrl: string
}) {
  const [direction, setDirection] = useState<Direction>("toSchool")
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const times = direction === "toSchool" ? route.toSchool : route.fromSchool
  const upcoming = useMemo(() => nextDeparture(times, now), [times, now])

  return (
    <article className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200/80">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{route.name}</h2>
        <div className="flex rounded-full bg-zinc-100 p-0.5 text-xs font-medium">
          <button
            className={
              direction === "toSchool"
                ? "rounded-full bg-zinc-900 px-2.5 py-1 text-white"
                : "rounded-full px-2.5 py-1 text-zinc-600"
            }
            onClick={() => setDirection("toSchool")}
            type="button"
          >
            등교
          </button>
          <button
            className={
              direction === "fromSchool"
                ? "rounded-full bg-zinc-900 px-2.5 py-1 text-white"
                : "rounded-full px-2.5 py-1 text-zinc-600"
            }
            onClick={() => setDirection("fromSchool")}
            type="button"
          >
            하교
          </button>
        </div>
      </div>

      {times.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          시간표 준비 중 —{" "}
          <a
            className="font-medium text-zinc-900 underline underline-offset-2"
            href={source}
            rel="noopener noreferrer"
            target="_blank"
          >
            공식 안내 바로가기
          </a>
        </p>
      ) : upcoming ? (
        <p className="mt-4">
          <span className="block text-xs font-medium text-zinc-500">다음 버스</span>
          <span className="mt-1 block text-3xl font-semibold tracking-tight">
            {upcoming.time}
          </span>
          <span className="mt-1 block text-sm text-zinc-600">
            {upcoming.minutesLeft === 0 ? "출발 시각입니다" : `${upcoming.minutesLeft}분 후`}
          </span>
        </p>
      ) : (
        <p className="mt-4 text-sm font-medium text-zinc-600">오늘 운행 종료</p>
      )}

      {times.length > 0 ? (
        <ol className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
          {times.map(time => (
            <li
              className={
                upcoming?.time === time
                  ? "rounded-lg bg-zinc-900 py-2 font-semibold text-white"
                  : "rounded-lg bg-zinc-50 py-2 text-zinc-700"
              }
              key={time}
            >
              {time}
            </li>
          ))}
        </ol>
      ) : null}

      {route.stops.length > 0 ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">{route.stops.join(" → ")}</p>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-zinc-500">{route.notes}</p>
      <p className="mt-2 text-xs">
        <a
          className="font-medium text-blue-700 underline-offset-2 hover:underline"
          href={reservationUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          통학버스 예약
        </a>
      </p>
    </article>
  )
}
