"use client"

import { useState } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ProgressBar } from "@/components/booking/ProgressBar"

export default function ConfirmarPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const serviceId = searchParams.get("serviceId") ?? ""
  const serviceName = searchParams.get("serviceName") ?? ""
  const serviceLabel = searchParams.get("serviceLabel") ?? ""
  const date = searchParams.get("date") ?? ""
  const time = searchParams.get("time") ?? ""
  const dateLabel = searchParams.get("dateLabel") ?? ""

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState("")

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  }

  const validate = () => {
    const errs: { name?: string; phone?: string } = {}
    if (!name.trim()) errs.name = "Informe seu nome completo"
    if (phone.replace(/\D/g, "").length < 10) errs.phone = "Informe um WhatsApp válido"
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
        body: JSON.stringify({ serviceId, startTime, clientName: name, clientPhone: phone }),
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
    <>
      {/* Barra de progresso — tela 3 de 3 */}
      <ProgressBar step={3} />

      {/* Contexto acumulado — serviço + data/hora */}
      <div className="bg-primary-light border border-secondary rounded-md px-3 py-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-primary text-xs">✓</span>
              <p className="text-sm font-semibold text-primary-dark">{serviceName}</p>
            </div>
            {serviceLabel && (
              <p className="text-xs text-primary ml-4">{serviceLabel}</p>
            )}
            {dateLabel && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-primary text-xs">✓</span>
                <p className="text-xs font-medium text-primary-dark">{dateLabel}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => router.push(`/${slug}/agendar?serviceId=${serviceId}&serviceName=${encodeURIComponent(serviceName)}&serviceLabel=${encodeURIComponent(serviceLabel)}`)}
            className="text-xs text-primary underline hover:text-primary-dark ml-4 shrink-0"
          >
            Alterar
          </button>
        </div>
      </div>

      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Seus dados</p>

      <Input
        label="Nome completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Maria da Silva"
        error={errors.name}
      />

      <Input
        label="WhatsApp"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(formatPhone(e.target.value))}
        placeholder="(11) 00000-0000"
        error={errors.phone}
      />

      {apiError && (
        <div className="bg-error-light border border-error rounded-md p-3">
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
    </>
  )
}
