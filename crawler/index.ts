import { supabaseService } from "../lib/supabase"
import { crawlAllBoards } from "./run"

async function main(): Promise<void> {
  const results = await crawlAllBoards({ writer: supabaseService() })

  for (const result of results) {
    const status = result.error ? `error=${result.error}` : "ok"
    console.log(
      `[crawl] ${result.board}: parsed=${result.parsed} stored=${result.stored} ${status}`,
    )
  }

  const inserted = results.reduce((sum, result) => sum + result.stored, 0)
  const failed = results.filter(result => result.error !== null)
  if (failed.length > 0) {
    console.error(`[crawl] completed with ${failed.length} board error(s)`)
    process.exitCode = 1
    return
  }

  console.log(`[crawl] done, ${inserted} inserted total`)
}

main().catch(error => {
  const message = error instanceof Error ? error.message : "unknown error"
  console.error(`[crawl] fatal: ${message}`)
  process.exitCode = 1
})
