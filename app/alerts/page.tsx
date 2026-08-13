import type { Metadata } from "next"
import { KeywordForm } from "@/components/KeywordForm"

export const metadata: Metadata = {
  title: "키워드 알림 — 순모아",
}

export default function AlertsPage() {
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
  const vapidPublicKey = vapid.startsWith("YOUR_") ? "" : vapid

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <h1 className="text-lg font-semibold tracking-tight">키워드 알림</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        로그인 없이 키워드만 저장합니다. 새 공지 제목에 단어가 들어가면 웹 푸시로 알려 드려요.
      </p>
      <KeywordForm vapidPublicKey={vapidPublicKey} />
    </div>
  )
}
