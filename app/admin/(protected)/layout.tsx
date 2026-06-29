import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ReactNode } from "react"
import Link from "next/link"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/admin/login")

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <main className="flex-1 max-w-md mx-auto w-full pb-20">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-300 flex max-w-md mx-auto">
        {[
          { href: "/admin/agenda", label: "Agenda", icon: "📅" },
          { href: "/admin/servicos", label: "Serviços", icon: "📋" },
          { href: "/admin/horarios", label: "Horários", icon: "🕐" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-neutral-500 hover:text-primary transition-colors"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
