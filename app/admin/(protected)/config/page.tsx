"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function ConfigPage() {
  const [notifyEmail, setNotifyEmail] = useState("")
  const [notifyEnabled, setNotifyEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/establishment")
      .then((r) => r.json())
      .then((data) => {
        const email = data.establishment?.notifyEmail ?? ""
        setNotifyEmail(email)
        setNotifyEnabled(!!email)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setError("")
    if (notifyEnabled && notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) {
      setError("Informe um email válido")
      return
    }
    setSaving(true)
    await fetch("/api/admin/establishment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifyEmail: notifyEnabled ? notifyEmail || null : null }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">Configurações</h1>
        <p className="text-sm text-neutral-500 mt-1">Ajustes do seu estabelecimento</p>
      </div>

      <div className="max-w-xl flex flex-col gap-6">
      <div className="bg-neutral-100 border border-neutral-300 rounded-md p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Notificações por email</p>
            <p className="text-xs text-neutral-500 mt-1">
              Receba um email a cada novo agendamento, com os dados do cliente e um arquivo
              para adicionar direto na sua agenda (Google Calendar, Apple Calendar, Outlook).
            </p>
          </div>
          <button
            onClick={() => setNotifyEnabled((v) => !v)}
            className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${notifyEnabled ? "bg-primary" : "bg-neutral-300"}`}
          >
            <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all ${notifyEnabled ? "right-0.5" : "left-0.5"}`} />
          </button>
        </div>

        {notifyEnabled && (
          loading ? (
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
          )
        )}

        <Button variant="primary" size="lg" loading={saving} onClick={handleSave}>
          {saved ? "✓ Salvo!" : "Salvar"}
        </Button>
      </div>
      </div>
    </div>
  )
}
