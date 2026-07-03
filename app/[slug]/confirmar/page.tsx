"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

function ConfirmarContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const serviceId = searchParams.get("serviceId") ?? ""
  const serviceName = searchParams.get("serviceName") ?? ""
  const serviceLabel = searchParams.get("serviceLabel") ?? ""
  // serviceDuration e servicePrice vêm como params diretos ou extraídos do serviceLabel ("60 min · R$ 300,00")
  const serviceDuration = searchParams.get("serviceDuration") || serviceLabel.match(/^(\d+)\s*min/)?.[1] || ""
  const servicePrice = searchParams.get("servicePrice") || serviceLabel.split("·")[1]?.trim() || ""
  const date = searchParams.get("date") ?? ""
  const time = searchParams.get("time") ?? ""
  const dateLabel = searchParams.get("dateLabel") ?? ""

  // Formata a data por extenso: "Quarta, 9 de julho às 15:00"
  const dateFormatted = date
    ? new Date(`${date}T12:00`).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : ""
  const dateTimeFormatted = dateFormatted && time
    ? `${dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)} às ${time}`
    : dateLabel

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState("")

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  }

  const validate = () => {
    const errs: { name?: string; phone?: string; email?: string } = {}
    if (!name.trim()) errs.name = "Informe seu nome completo"
    if (phone.replace(/\D/g, "").length < 10) errs.phone = "Informe um telefone válido"
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Informe um email válido"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setApiError("")
    try {
      const startTime = new Date(`${date}T${time}:00`)
      const res = await fetch(`/api/${slug}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, startTime, clientName: name, clientPhone: phone, clientEmail: email }),
      })
      const data = await res.json()
      if (res.status === 409) { setApiError(data.error); return }
      if (!res.ok) throw new Error(data.error)
      router.push(
        `/${slug}/sucesso?token=${data.cancelToken}&service=${encodeURIComponent(data.serviceName)}&date=${date}&time=${time}`
      )
    } catch {
      setApiError("Erro ao confirmar agendamento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Contexto acumulado */}
      <div className="bg-primary-light border border-secondary rounded-2xl px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-primary-dark">{serviceName}</p>
            {serviceLabel && <p className="text-xs text-primary">{serviceLabel}</p>}
            {dateLabel && (
              <p className="text-xs font-medium text-primary-dark">{dateLabel}</p>
            )}
          </div>
          <button
            onClick={() => router.push(`/${slug}/agendar?serviceId=${serviceId}&serviceName=${encodeURIComponent(serviceName)}&serviceLabel=${encodeURIComponent(serviceLabel)}`)}
            className="text-xs font-semibold text-primary underline hover:text-primary-dark ml-4 shrink-0"
          >
            Alterar
          </button>
        </div>
      </div>

      {/* Dados do paciente */}
      <Input
        label="Nome completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Maria da Silva"
        error={errors.name}
      />

      <Input
        label="Telefone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(formatPhone(e.target.value))}
        placeholder="(11) 00000-0000"
        error={errors.phone}
      />

      <Input
        label="Seu melhor email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="maria@exemplo.com"
        error={errors.email}
      />

      {apiError && (
        <div className="bg-error-light border border-error rounded-2xl p-3">
          <p className="text-sm text-error">{apiError}</p>
          {apiError.includes("horário") && (
            <button onClick={() => router.back()} className="text-sm text-error underline mt-1">
              Escolher outro horário
            </button>
          )}
        </div>
      )}

      <Button variant="primary" size="lg" loading={loading} onClick={handleSubmit}>
        Agendar agora
      </Button>

      <p className="text-xs text-neutral-500 text-center">
        🔒 Seus dados são usados apenas para confirmar seu agendamento.
      </p>
    </div>
  )
}

export default function ConfirmarPage() {
  return (
    <Suspense>
      <ConfirmarContent />
    </Suspense>
  )
}
