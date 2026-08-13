export function normalizeKeywords(raw: string): string[] {
  const seen = new Set<string>()
  for (const part of raw.split(/[,\s]+/)) {
    const keyword = part.trim().toLowerCase()
    if (keyword.length >= 1 && keyword.length <= 20) seen.add(keyword)
    if (seen.size >= 10) break
  }
  return [...seen]
}

export function matchesAny(title: string, keywords: string[]): boolean {
  const haystack = title.toLowerCase()
  return keywords.some(keyword => haystack.includes(keyword))
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  return Uint8Array.from(raw, char => char.charCodeAt(0))
}
