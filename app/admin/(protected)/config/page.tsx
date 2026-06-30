"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function ConfigPage() {
  const [notifyEmail, setNotifyEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/establishment")
      .then((r) => r.json())
      .then((data) => {
        setNotifyEmail(data.establishment?.notifyEmail ?? "")
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setError("")
    if (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) {
      setError("Informe um email válido")
      return
    }
    setSaving(true)
    await fetch("/api/admin/establishment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifyEmail: notifyEmail || null }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">Configurações</h1>
        <p className="text-sm text-neutral-500 mt-1">Ajustes do seu estabelecimento</p>
      </div>

      <div className="bg-neutral-100 border border-neutral-300 rounded-md p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Notificações por email</p>
          <p className="text-xs text-neutral-500 mt-1">
            Você receberá um email a cada novo agendamento, com os dados do cliente e um arquivo
            para adicionar direto na sua agenda (Google Calendar, Apple Calendar, Outlook).
          </p>
        </div>

        {loading ? (
          <div className="h-10 rounded-md bg-neutral-200 animate-pulse" />
        ) : (
          <Input
            label="Email para receber notificações"
            type="email"
            value={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            error={error}
          />
        )}

        {notifyEmail && !error && (
          <p className="text-xs text-neutral-500">
            Deixe em branco para desativar as notificações.
          </p>
        )}

        <Button variant="primary" size="lg" loading={saving} onClick={handleSave}>
          {saved ? "✓ Salvo!" : "Salvar"}
        </Button>
      </div>
    </div>
  )
}
