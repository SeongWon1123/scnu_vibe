import { NextRequest, NextResponse } from "next/server"
import { buildIcs } from "@/lib/calendar"

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const title = params.get("title") ?? ""
  const date = params.get("date") ?? ""
  const url = params.get("url") ?? ""

  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid params" }, { status: 400 })
  }

  return new NextResponse(buildIcs(title, date, url), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sunmoa.ics"',
    },
  })
}
