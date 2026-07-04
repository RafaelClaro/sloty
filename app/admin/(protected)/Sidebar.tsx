"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

const items = [
  { href: "/admin/agenda",   icon: "📅", label: "Agenda" },
  { href: "/admin/servicos", icon: "📋", label: "Serviços" },
  { href: "/admin/horarios", icon: "🕐", label: "Horários" },
  { href: "/admin/config",   icon: "⚙️", label: "Config" },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-52 bg-white border-r border-neutral-200 shrink-0 p-4 gap-1 min-h-screen sticky top-0">
      <div className="px-2 mb-6">
        <p className="text-sm font-bold text-primary">AgendaAí</p>
        <p className="text-xs text-neutral-400 mt-0.5">Painel admin</p>
      </div>
      {items.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${active ? "bg-primary-light text-primary font-semibold" : "text-neutral-600 hover:bg-neutral-50"}`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </aside>
  )
}
