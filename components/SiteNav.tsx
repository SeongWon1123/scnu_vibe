"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/", label: "공지" },
  { href: "/bus", label: "버스" },
  { href: "/alerts", label: "알림" },
] as const

export function SiteNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-3">
        {TABS.map(tab => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href)
          return (
            <li key={tab.href}>
              <Link
                className={
                  active
                    ? "flex h-14 items-center justify-center text-sm font-semibold text-zinc-900"
                    : "flex h-14 items-center justify-center text-sm font-medium text-zinc-500"
                }
                href={tab.href}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
