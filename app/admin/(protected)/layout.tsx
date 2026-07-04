import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ReactNode } from "react"
import { BottomNav } from "./BottomNav"
import { Sidebar } from "./Sidebar"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/admin/login")

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
