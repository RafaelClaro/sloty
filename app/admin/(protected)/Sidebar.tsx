"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

function IconAgenda({ active }: { active: boolean }) {
  const c = active ? "#2D6A4F" : "#6B7280"
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconServicos({ active }: { active: boolean }) {
  const c = active ? "#2D6A4F" : "#6B7280"
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  )
}

function IconHorarios({ active }: { active: boolean }) {
  const c = active ? "#2D6A4F" : "#6B7280"
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  )
}

function IconConfig({ active }: { active: boolean }) {
  const c = active ? "#2D6A4F" : "#6B7280"
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const items = [
  { href: "/admin/agenda",   label: "Agenda",   Icon: IconAgenda },
  { href: "/admin/servicos", label: "Serviços",  Icon: IconServicos },
  { href: "/admin/horarios", label: "Horários",  Icon: IconHorarios },
  { href: "/admin/config",   label: "Config",    Icon: IconConfig },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-52 bg-white border-r border-neutral-200 shrink-0 p-4 gap-1 min-h-screen sticky top-0">
      <div className="px-2 mb-6">
        <p className="text-sm font-bold text-primary">AgendaAí</p>
        <p className="text-xs text-neutral-400 mt-0.5">Painel admin</p>
      </div>
      {items.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${active ? "bg-primary-light text-primary font-semibold" : "text-neutral-600 hover:bg-neutral-50"}`}
          >
            <Icon active={active} />
            {label}
          </Link>
        )
      })}
    </aside>
  )
}
