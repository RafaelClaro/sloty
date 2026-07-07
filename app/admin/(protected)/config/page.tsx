"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function ConfigPage() {
  const [notifyEmail, setNotifyEmail] = useState("")
  const [notifyEnabled, setNotifyEnabled] = useState(true)
  const [primaryColor, setPrimaryColor] = useState("#2D6A4F")
  const [primaryDark, setPrimaryDark] = useState("#1B4332")
  const [primaryLight, setPrimaryLight] = useState("#D8F3DC")
  const [fontFamily, setFontFamily] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/establishment")
      .then((r) => r.json())
      .then((data) => {
        const e = data.establishment
        if (!e) return
        setNotifyEmail(e.notifyEmail ?? "")
        setNotifyEnabled(!!e.notifyEmail)
        setPrimaryColor(e.primaryColor ?? "#2D6A4F")
        setPrimaryDark(e.primaryDark ?? "#1B4332")
        setPrimaryLight(e.primaryLight ?? "#D8F3DC")
        setFontFamily(e.fontFamily ?? "")
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
      body: JSON.stringify({
        notifyEmail: notifyEnabled ? notifyEmail || null : null,
        primaryColor,
        primaryDark,
        primaryLight,
        fontFamily: fontFamily || null,
      }),
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
        {/* Notificações */}
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
        </div>

        {/* Identidade visual */}
        <div className="bg-neutral-100 border border-neutral-300 rounded-md p-4 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Identidade visual</p>
            <p className="text-xs text-neutral-500 mt-1">
              Personalize as cores e a fonte exibidas no seu link de agendamento.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-10 rounded-md bg-neutral-200 animate-pulse" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Cor principal */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-700">Cor principal</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#2D6A4F"
                    className="flex-1 bg-white border border-neutral-300 rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Cor escura */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-700">Cor de hover / escura</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryDark}
                    onChange={(e) => setPrimaryDark(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={primaryDark}
                    onChange={(e) => setPrimaryDark(e.target.value)}
                    placeholder="#1B4332"
                    className="flex-1 bg-white border border-neutral-300 rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Cor clara */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-700">Cor de fundo suave</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryLight}
                    onChange={(e) => setPrimaryLight(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={primaryLight}
                    onChange={(e) => setPrimaryLight(e.target.value)}
                    placeholder="#D8F3DC"
                    className="flex-1 bg-white border border-neutral-300 rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Fonte */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-700">Fonte dos títulos</label>
                <input
                  type="text"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  placeholder="Ex: Cormorant Garamond, Playfair Display"
                  className="bg-white border border-neutral-300 rounded-md px-3 py-2 text-sm"
                />
                <p className="text-xs text-neutral-400">Nome exato de uma fonte do Google Fonts</p>
              </div>
            </div>
          )}
        </div>

        <Button variant="primary" size="lg" loading={saving} onClick={handleSave}>
          {saved ? "✓ Salvo!" : "Salvar configurações"}
        </Button>
      </div>
    </div>
  )
}
