"use client"

import { useState, useSyncExternalStore } from "react"
import { normalizeKeywords, urlBase64ToUint8Array } from "@/lib/keywords"

const SUGGESTIONS = ["장학", "기숙사", "수강신청", "등록금", "통학"] as const

function subscribe() {
  return () => {}
}

function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window
}

export function KeywordForm({ vapidPublicKey }: { vapidPublicKey: string }) {
  const supported = useSyncExternalStore(subscribe, pushSupported, () => false)
  const [raw, setRaw] = useState("장학")
  const [registered, setRegistered] = useState<string[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!supported) {
    return (
      <p className="mt-6 text-sm leading-6 text-zinc-600">
        이 브라우저는 웹 푸시를 지원하지 않아요. 아이폰은 공유 → 홈 화면에 추가 후 이용
        가능해요.
      </p>
    )
  }

  if (!vapidPublicKey) {
    return (
      <p className="mt-6 text-sm leading-6 text-zinc-600">
        알림 키가 아직 설정되지 않았어요. `.env.local`에 VAPID 값을 넣은 뒤 다시 시도하세요.
      </p>
    )
  }

  async function enableAlerts() {
    const keywords = normalizeKeywords(raw)
    if (keywords.length === 0) {
      setMessage("키워드를 한 개 이상 입력하세요.")
      return
    }

    setBusy(true)
    setMessage(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setMessage("브라우저 설정에서 알림 권한을 허용해야 해요.")
        return
      }

      const registration = await navigator.serviceWorker.register("/sw.js")
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      })

      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription, keywords: raw }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setMessage("구독 저장에 실패했어요. 잠시 후 다시 시도하세요.")
        return
      }
      setRegistered(payload?.keywords ?? keywords)
      setMessage("키워드 알림을 켜 두었어요.")
    } catch (error) {
      const text = error instanceof Error ? error.message : "unknown error"
      setMessage(`알림 등록에 실패했어요. (${text})`)
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    setBusy(true)
    setMessage(null)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await fetch("/api/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }
      setRegistered(null)
      setMessage("알림을 껐어요.")
    } catch {
      setMessage("알림 해제에 실패했어요.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4">
      <label className="text-sm font-medium text-zinc-700" htmlFor="keywords">
        알림 키워드
      </label>
      <input
        className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
        id="keywords"
        onChange={event => setRaw(event.target.value)}
        placeholder="장학, 기숙사, 수강신청"
        value={raw}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {SUGGESTIONS.map(keyword => (
          <button
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200"
            key={keyword}
            onClick={() => {
              const next = normalizeKeywords(`${raw} ${keyword}`)
              setRaw(next.join(", "))
            }}
            type="button"
          >
            {keyword}
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={busy}
          onClick={() => void enableAlerts()}
          type="button"
        >
          알림 받기
        </button>
        {registered ? (
          <button
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-50"
            disabled={busy}
            onClick={() => void unsubscribe()}
            type="button"
          >
            알림 끄기
          </button>
        ) : null}
      </div>
      {registered ? (
        <p className="mt-3 text-sm text-zinc-600">등록됨: {registered.join(", ")}</p>
      ) : null}
      {message ? <p className="mt-2 text-sm text-zinc-600">{message}</p> : null}
    </div>
  )
}
