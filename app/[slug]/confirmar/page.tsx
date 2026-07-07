"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"

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
  const [reason, setReason] = useState("")
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
        body: JSON.stringify({ serviceId, startTime, clientName: name, clientPhone: phone, clientEmail: email, reason: reason || undefined }),
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

  const inputBase: React.CSSProperties = {
    background: "#F3F4F6",
    border: "none",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 14,
    color: "#111827",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 4,
    display: "block",
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Card de resumo */}
      <div
        style={{
          background: "var(--color-primary-light)",
          border: "1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)",
          borderRadius: 12,
          padding: "12px 14px",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-primary-dark)" }}>{serviceName}</p>
            {serviceLabel && (
              <p style={{ fontSize: 12, color: "var(--color-primary)" }}>{serviceLabel}</p>
            )}
            {dateTimeFormatted && (
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-primary)" }}>{dateTimeFormatted}</p>
            )}
          </div>
          <button
            onClick={() => router.push(`/${slug}/agendar?serviceId=${serviceId}&serviceName=${encodeURIComponent(serviceName)}&serviceLabel=${encodeURIComponent(serviceLabel)}`)}
            style={{ fontSize: 11, color: "#52B788", textDecoration: "underline", marginLeft: 12, flexShrink: 0 }}
          >
            Alterar
          </button>
        </div>
      </div>

      {/* Nome completo */}
      <div>
        <label style={labelStyle}>Nome completo</label>
        <input
          style={inputBase}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Maria da Silva"
          onFocus={(e) => { e.target.style.background = "var(--color-primary-light)"; e.target.style.boxShadow = "0 0 0 2px var(--color-primary)" }}
          onBlur={(e) => { e.target.style.background = "#F3F4F6"; e.target.style.boxShadow = "none" }}
        />
        {errors.name && <span style={{ fontSize: 12, color: "#EF4444", marginTop: 2, display: "block" }}>{errors.name}</span>}
      </div>

      {/* WhatsApp */}
      <div>
        <label style={labelStyle}>WhatsApp</label>
        <input
          style={inputBase}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(11) 00000-0000"
          onFocus={(e) => { e.target.style.background = "var(--color-primary-light)"; e.target.style.boxShadow = "0 0 0 2px var(--color-primary)" }}
          onBlur={(e) => { e.target.style.background = "#F3F4F6"; e.target.style.boxShadow = "none" }}
        />
        {errors.phone && <span style={{ fontSize: 12, color: "#EF4444", marginTop: 2, display: "block" }}>{errors.phone}</span>}
      </div>

      {/* Email (opcional) */}
      <div>
        <label style={labelStyle}>
          Email{" "}
          <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(opcional)</span>
        </label>
        <input
          style={inputBase}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="maria@exemplo.com"
          onFocus={(e) => { e.target.style.background = "var(--color-primary-light)"; e.target.style.boxShadow = "0 0 0 2px var(--color-primary)" }}
          onBlur={(e) => { e.target.style.background = "#F3F4F6"; e.target.style.boxShadow = "none" }}
        />
        {errors.email && <span style={{ fontSize: 12, color: "#EF4444", marginTop: 2, display: "block" }}>{errors.email}</span>}
      </div>

      {/* Motivo da consulta */}
      <div>
        <label style={labelStyle}>
          Motivo da consulta{" "}
          <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(opcional)</span>
        </label>
        <div style={{ position: "relative" }}>
          <textarea
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: dor abdominal há 3 dias, quero avaliar meu peso, acompanhamento pós-cirurgia..."
            style={{
              ...inputBase,
              resize: "none",
              fontFamily: "inherit",
              lineHeight: 1.5,
              paddingBottom: 24,
            }}
            onFocus={(e) => { e.target.style.background = "var(--color-primary-light)"; e.target.style.boxShadow = "0 0 0 2px var(--color-primary)" }}
            onBlur={(e) => { e.target.style.background = "#F3F4F6"; e.target.style.boxShadow = "none" }}
          />
          <span
            style={{
              position: "absolute",
              bottom: 8,
              right: 12,
              fontSize: 11,
              color: reason.length >= 450 ? "#F59E0B" : "#9CA3AF",
              pointerEvents: "none",
            }}
          >
            {reason.length}/500
          </span>
        </div>
      </div>

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

      {/* Botão agendar */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          background: loading ? "var(--color-primary-dark)" : "var(--color-primary)",
          color: "#fff",
          borderRadius: 12,
          padding: "13px",
          fontSize: 15,
          fontWeight: 500,
          width: "100%",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {loading ? "Agendando..." : "Agendar agora"}
      </button>

      <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
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
