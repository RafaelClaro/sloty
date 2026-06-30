import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ReactNode } from "react"
import { BottomNav } from "./BottomNav"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/admin/login")

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <main className="flex-1 max-w-md mx-auto w-full pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
