"use client"

import { useState } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function ConfirmarPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const serviceId = searchParams.get("serviceId") ?? ""
  const date = searchParams.get("date") ?? ""
  const time = searchParams.get("time") ?? ""

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

      if (res.status === 409) {
        setApiError(data.error)
        return
      }
      if (!res.ok) throw new Error(data.error)

      router.push(`/${slug}/sucesso?token=${data.cancelToken}&service=${encodeURIComponent(data.serviceName)}&date=${date}&time=${time}`)
    } catch {
      setApiError("Erro ao confirmar agendamento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const dateLabel = new Date(`${date}T12:00`).toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  })

  return (
    <>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary text-sm font-medium pb-3 border-b border-neutral-300"
      >
        ← {dateLabel} às {time}
      </button>

      <div className="bg-primary-light border border-secondary rounded-md p-3">
        <p className="text-xs font-semibold text-primary-dark uppercase tracking-wide">Resumo</p>
        <p className="text-sm font-medium text-primary-dark mt-1">{dateLabel} às {time}</p>
      </div>

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
