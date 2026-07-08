"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform text-neutral-400 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function Accordion({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-neutral-100 border border-neutral-300 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-200/50 transition-colors"
      >
        <div>
          <p className="text-sm font-semibold text-neutral-900">{title}</p>
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-neutral-200">
          <div />
          {children}
        </div>
      )}
    </div>
  )
}

const EyeOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeClosed = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
  </svg>
)

function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        className="w-full border border-neutral-300 rounded-md px-3 py-2 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600" tabIndex={-1}>
        {show ? <EyeClosed /> : <EyeOpen />}
      </button>
    </div>
  )
}

export default function ConfigPage() {
  const [notifyEmail, setNotifyEmail] = useState("")
  const [notifyEnabled, setNotifyEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState("")
  const [pwSaved, setPwSaved] = useState(false)

  const [newEmail, setNewEmail] = useState("")
  const [emailPassword, setEmailPassword] = useState("")
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [emailSaved, setEmailSaved] = useState(false)
  const [currentEmail, setCurrentEmail] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/establishment").then((r) => r.json()),
      fetch("/api/auth/session").then((r) => r.json()),
    ]).then(([estData, sessionData]) => {
      const e = estData.establishment
      if (e) {
        setNotifyEmail(e.notifyEmail ?? "")
        setNotifyEnabled(!!e.notifyEmail)
      }
      if (sessionData?.user?.email) setCurrentEmail(sessionData.user.email)
    }).finally(() => setLoading(false))
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

      <div className="max-w-xl flex flex-col gap-3">

        {/* Notificações */}
        <Accordion title="Notificações por email" subtitle="Receba um email a cada novo agendamento">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-500">
              Receba os dados do cliente e um arquivo para adicionar direto na sua agenda (Google Calendar, Apple Calendar, Outlook).
            </p>
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
        </Accordion>

        {/* Alterar email */}
        <Accordion title="Alterar email de acesso" subtitle={currentEmail ? `Atual: ${currentEmail}` : undefined}>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-700">Novo email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="novo@email.com"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-700">Confirme sua senha atual</label>
            <PasswordInput value={emailPassword} onChange={setEmailPassword} />
            {emailError && <p className="text-xs text-red-500 mt-0.5">{emailError}</p>}
          </div>
          <Button
            variant="primary"
            size="lg"
            loading={emailSaving}
            onClick={async () => {
              setEmailError("")
              if (!newEmail || !emailPassword) { setEmailError("Preencha todos os campos"); return }
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailError("Informe um email válido"); return }
              setEmailSaving(true)
              const res = await fetch("/api/admin/email", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newEmail, currentPassword: emailPassword }),
              })
              const data = await res.json()
              setEmailSaving(false)
              if (!res.ok) { setEmailError(data.error); return }
              setEmailSaved(true)
              setCurrentEmail(newEmail)
              setNewEmail(""); setEmailPassword("")
              setTimeout(() => setEmailSaved(false), 3000)
            }}
          >
            {emailSaved ? "✓ Email alterado!" : "Alterar email"}
          </Button>
        </Accordion>

        {/* Alterar senha */}
        <Accordion title="Alterar senha" subtitle="Escolha uma senha forte com pelo menos 8 caracteres">
          {[
            { label: "Senha atual", value: currentPassword, set: setCurrentPassword },
            { label: "Nova senha", value: newPassword, set: setNewPassword },
            { label: "Confirmar nova senha", value: confirmPassword, set: setConfirmPassword },
          ].map(({ label, value, set }, i) => (
            <div key={i} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-700">{label}</label>
              <PasswordInput value={value} onChange={set} />
              {i === 2 && pwError && <p className="text-xs text-red-500 mt-0.5">{pwError}</p>}
            </div>
          ))}
          <Button
            variant="primary"
            size="lg"
            loading={pwSaving}
            onClick={async () => {
              setPwError("")
              if (!currentPassword || !newPassword || !confirmPassword) { setPwError("Preencha todos os campos"); return }
              if (newPassword !== confirmPassword) { setPwError("As senhas não coincidem"); return }
              if (newPassword.length < 8) { setPwError("A nova senha deve ter ao menos 8 caracteres"); return }
              setPwSaving(true)
              const res = await fetch("/api/admin/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
              })
              const data = await res.json()
              setPwSaving(false)
              if (!res.ok) { setPwError(data.error); return }
              setPwSaved(true)
              setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
              setTimeout(() => setPwSaved(false), 3000)
            }}
          >
            {pwSaved ? "✓ Senha alterada!" : "Alterar senha"}
          </Button>
        </Accordion>

        {/* Sair — só no mobile (desktop usa sidebar) */}
        <div className="md:hidden mt-6 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-2 text-sm text-red-500 font-medium"
          >
            <span>↪</span> Sair da conta
          </button>
        </div>

      </div>
    </div>
  )
}
