import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Agendamento",
  description: "Plataforma de agendamento de serviços",
  manifest: "/manifest.json",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
