import { NextRequest, NextResponse } from "next/server"
import { normalizeKeywords } from "@/lib/keywords"
import { supabaseService } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const subscription = body?.subscription
    const keywords = normalizeKeywords(String(body?.keywords ?? ""))
    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth ||
      keywords.length === 0
    ) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 })
    }

    const { error } = await supabaseService().from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        keywords,
      },
      { onConflict: "endpoint" },
    )
    if (error) return NextResponse.json({ error: "db error" }, { status: 500 })
    return NextResponse.json({ ok: true, keywords })
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    console.error(`[subscribe] ${message}`)
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body?.endpoint) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 })
    }
    await supabaseService().from("push_subscriptions").delete().eq("endpoint", body.endpoint)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    console.error(`[subscribe] ${message}`)
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }
}
