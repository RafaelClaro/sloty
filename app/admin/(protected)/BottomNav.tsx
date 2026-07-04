"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

const items = [
  { href: "/admin/agenda", label: "Agenda", icon: "📅" },
  { href: "/admin/servicos", label: "Serviços", icon: "📋" },
  { href: "/admin/horarios", label: "Horários", icon: "🕐" },
  { href: "/admin/config", label: "Config", icon: "⚙️" },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-300 flex">
      {items.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors
              ${active ? "text-primary" : "text-neutral-400"}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`text-xs ${active ? "font-semibold" : "font-medium"}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
