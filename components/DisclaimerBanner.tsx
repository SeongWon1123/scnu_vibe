"use client"

import { useState } from "react"

const DISCLAIMER =
  "본 서비스는 국립순천대학교 공식 서비스가 아닙니다. 크롤링 지연·오류로 정보가 다를 수 있으니, 마감일 등 중요한 정보는 반드시 학교 홈페이지 원문을 확인하세요."

export function DisclaimerBanner() {
  const [open, setOpen] = useState(true)

  return (
    <div className="sticky top-0 z-40 border-b border-amber-200 bg-amber-50 text-amber-950">
      <div className="mx-auto flex max-w-3xl items-start gap-3 px-4 py-2.5">
        {open ? (
          <p className="min-w-0 flex-1 text-[13px] leading-5">
            {DISCLAIMER}{" "}
            <a
              className="font-medium underline underline-offset-2"
              href="https://www.scnu.ac.kr"
              rel="noopener noreferrer"
              target="_blank"
            >
              학교 홈페이지
            </a>
          </p>
        ) : (
          <p className="min-w-0 flex-1 text-[13px] leading-5">
            비공식 서비스 · 중요한 정보는 원문을 확인하세요.
          </p>
        )}
        <button
          className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
          onClick={() => setOpen(value => !value)}
          type="button"
        >
          {open ? "접기" : "펼치기"}
        </button>
      </div>
    </div>
  )
}
