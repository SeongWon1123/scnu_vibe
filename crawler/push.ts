import webpush from "web-push"
import { matchesAny } from "../lib/keywords"
import { supabaseService } from "../lib/supabase"
import type { InsertedNotice } from "./store"

export interface Sub {
  endpoint: string
  p256dh: string
  auth: string
  keywords: string[]
}

const MAX_PER_SUB = 3

export function planPushes(
  notices: InsertedNotice[],
  subs: Sub[],
): { sub: Sub; notice: InsertedNotice }[] {
  const plan: { sub: Sub; notice: InsertedNotice }[] = []
  for (const sub of subs) {
    let count = 0
    for (const notice of notices) {
      if (count >= MAX_PER_SUB) break
      if (matchesAny(notice.title, sub.keywords)) {
        plan.push({ sub, notice })
        count += 1
      }
    }
  }
  return plan
}

export async function sendPushes(notices: InsertedNotice[]): Promise<void> {
  if (notices.length === 0) return

  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!subject || !publicKey || !privateKey || publicKey.startsWith("YOUR_")) {
    console.error("[push] missing VAPID environment variables")
    return
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)

  const db = supabaseService()
  const { data, error } = await db
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, keywords")
  if (error) throw error

  for (const { sub, notice } of planPushes(notices, (data ?? []) as Sub[])) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: `[순모아] ${notice.title}`,
          body: "새 공지가 올라왔어요",
          url: notice.url,
        }),
      )
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await db.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
        console.log("[push] pruned dead subscription")
      } else {
        console.error("[push] send failed:", status)
      }
    }
  }
}
