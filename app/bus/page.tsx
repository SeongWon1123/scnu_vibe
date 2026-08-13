import type { Metadata } from "next"
import { RouteCard } from "@/components/RouteCard"
import type { BusSchedules } from "@/lib/bus"
import schedules from "@/data/bus-schedules.json"

const busSchedules = schedules as BusSchedules

export const metadata: Metadata = {
  title: "통학버스 — 순모아",
}

export default function BusPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <p className="text-sm text-zinc-600">
        기준일 {busSchedules.updatedAt.replaceAll("-", ".")} ·{" "}
        <a
          className="font-medium text-zinc-900 underline underline-offset-2"
          href={busSchedules.source}
          rel="noopener noreferrer"
          target="_blank"
        >
          공식 안내 원문
        </a>
      </p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">
        여수·광주·동광양은 통학버스시스템 예약이 필요합니다. 시각은 PDF로만 공개되어 원문을
        확인하세요.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {busSchedules.routes.map(route => (
          <RouteCard
            key={route.id}
            reservationUrl={busSchedules.reservationUrl}
            route={route}
            source={busSchedules.source}
          />
        ))}
      </div>
    </div>
  )
}
