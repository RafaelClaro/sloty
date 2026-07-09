import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Agendamento",
  description: "Plataforma de agendamento de serviços",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" style={{ overflowX: "hidden" }}>
      <body style={{ overflowX: "hidden", maxWidth: "100vw" }}>{children}</body>
    </html>
  )
}
