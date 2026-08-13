import type { Metadata } from "next"
import { DisclaimerBanner } from "@/components/DisclaimerBanner"
import "./globals.css"

export const metadata: Metadata = {
  title: "순모아 — 순천대 공지·통학버스 알리미",
  description:
    "국립순천대학교 공지와 통학버스 정보를 한곳에서 확인하는 비공식 알리미입니다. 중요한 정보는 학교 홈페이지 원문을 확인하세요.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#f6f3ec] text-zinc-900">
        <DisclaimerBanner />
        <header className="border-b border-zinc-200/80 bg-[#f6f3ec]/90">
          <div className="mx-auto flex max-w-3xl items-baseline justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-lg font-semibold tracking-tight">순모아</p>
              <p className="text-xs text-zinc-500">순천대 공지·통학버스 알리미</p>
            </div>
            <a
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              href="https://www.scnu.ac.kr"
              rel="noopener noreferrer"
              target="_blank"
            >
              원문 사이트
            </a>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 bg-white/70">
          <div className="mx-auto max-w-3xl px-4 py-4 text-xs leading-5 text-zinc-500">
            학교 공식 서비스가 아닙니다. 마감일 등 중요한 정보는 반드시 원문을 확인하세요.
            <br />
            <a
              className="font-medium text-zinc-700 underline-offset-2 hover:underline"
              href="https://github.com/SeongWon1123/scnu_vibe"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}
