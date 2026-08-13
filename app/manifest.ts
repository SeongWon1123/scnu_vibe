import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "순모아",
    short_name: "순모아",
    description: "순천대 공지·통학버스 알리미",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3ec",
    theme_color: "#0f172a",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
