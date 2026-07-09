"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"

interface Booking {
  id: string
  status: string
  clientName: string
  startTime: string
  endTime: string
  cancelToken: string
  service: {
    name: string
    durationMinutes: number
    price: string
  }
}

function MeusAgendamentosContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug as string
  const tokenFromUrl = searchParams.get("token") ?? ""

  const [token, setToken] = useState(tokenFromUrl.toUpperCase())
  const [step, setStep] = useState<"buscar" | "encontrado" | "cancelado" | "reagendado">("buscar")
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (tokenFromUrl) {
      handleLookup(tokenFromUrl.toUpperCase())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLookup = async (t?: string) => {
    const searchToken = t ?? token
    if (!searchToken.trim()) {
      setError("Informe o código do agendamento")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/${slug}/bookings/lookup?token=${searchToken}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Código não encontrado")
        return
      }
      if (data.status === "CANCELLED") {
        setError("Este agendamento já foi cancelado.")
        return
      }
      setBooking(data)
      setStep("encontrado")
    } catch {
      setError("Erro ao buscar agendamento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!booking) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/${slug}/bookings/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelToken: booking.cancelToken }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Erro ao cancelar")
        setConfirmCancel(false)
        return
      }
      setStep("cancelado")
    } catch {
      setError("Erro ao cancelar. Tente novamente.")
    } finally {
      setCancelling(false)
    }
  }

  const handleReagendar = async () => {
    if (!booking) return
    setCancelling(true)
    try {
      await fetch(`/api/${slug}/bookings/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelToken: booking.cancelToken }),
      })
      setStep("reagendado")
    } catch {
      setError("Erro ao processar. Tente novamente.")
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long",
    })

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  const formatCurrency = (value: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))

  return (
    <div className="flex flex-col gap-4">

      {/* STEP — Buscar */}
      {step === "buscar" && (
        <>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 mb-1">
              Meus agendamentos
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              {tokenFromUrl
                ? "Identificamos seu agendamento pelo link do email."
                : "Informe o código recebido por email."}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-700">
              Código do agendamento
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              placeholder="Ex: NE5RW8KA"
              maxLength={12}
              style={{
                fontFamily: "monospace",
                letterSpacing: "0.15em",
                border: tokenFromUrl ? "1.5px solid var(--color-primary-border, #C5D3F0)" : "none",
              }}
              className="w-full px-4 py-3 rounded-xl bg-neutral-100 text-sm font-semibold
                         text-neutral-900 uppercase outline-none focus:ring-2
                         focus:ring-[var(--color-primary-light,#E8EEFB)]"
            />
            {tokenFromUrl && (
              <p className="text-xs" style={{ color: "var(--color-primary, #1B3F8B)" }}>
                ✓ Preenchido automaticamente pelo link do email
              </p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <button
            onClick={() => handleLookup()}
            disabled={loading}
            style={{ background: "var(--color-primary, #1B3F8B)" }}
            className="w-full py-3.5 rounded-xl text-white text-sm font-medium
                       disabled:opacity-50 transition-opacity"
          >
            {loading ? "Buscando..." : "Buscar agendamento"}
          </button>

          <button
            onClick={() => router.push(`/${slug}`)}
            className="text-sm text-neutral-400 text-center"
          >
            ← Voltar
          </button>
        </>
      )}

      {/* STEP — Encontrado */}
      {step === "encontrado" && booking && (
        <>
          <p className="text-base font-semibold text-neutral-900">Seu agendamento</p>

          <div
            className="rounded-2xl p-4 flex flex-col gap-1.5"
            style={{
              background: "var(--color-primary-light, #E8EEFB)",
              border: "1px solid var(--color-primary-border, #C5D3F0)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--color-primary-dark, #142D6E)" }}>
              {booking.service.name}
            </p>
            <p className="text-sm font-medium capitalize" style={{ color: "var(--color-primary, #1B3F8B)" }}>
              📅 {formatDate(booking.startTime)}
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--color-primary, #1B3F8B)" }}>
              🕐 {formatTime(booking.startTime)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {booking.service.durationMinutes} min · {formatCurrency(booking.service.price)}
            </p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {!confirmCancel ? (
            <>
              <button
                onClick={handleReagendar}
                disabled={cancelling}
                style={{ background: "var(--color-primary, #1B3F8B)" }}
                className="w-full py-3.5 rounded-xl text-white text-sm font-medium
                           flex items-center justify-center gap-2 disabled:opacity-50"
              >
                🔄 Reagendar
              </button>

              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full py-3 rounded-xl bg-transparent border border-neutral-200
                           text-sm text-neutral-400"
              >
                Cancelar agendamento
              </button>

              <p className="text-xs text-neutral-400 text-center leading-relaxed">
                Reagendar cancela este horário e abre o calendário para você escolher um novo.
              </p>
            </>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-sm font-medium text-neutral-900">Confirmar cancelamento?</p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                O horário será liberado para outros pacientes.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 py-2.5 rounded-lg border border-neutral-200 text-sm text-neutral-500"
                >
                  Manter
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-50"
                >
                  {cancelling ? "Cancelando..." : "Sim, cancelar"}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => { setStep("buscar"); setBooking(null); setConfirmCancel(false); setError("") }}
            className="text-sm text-neutral-400 text-center"
          >
            ← Buscar outro código
          </button>
        </>
      )}

      {/* STEP — Reagendado */}
      {step === "reagendado" && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ background: "var(--color-primary-light, #E8EEFB)" }}
          >
            🔄
          </div>
          <p className="text-base font-semibold text-neutral-900">Horário cancelado</p>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Escolha um novo horário para reagendar sua consulta.
          </p>
          <button
            onClick={() => router.push(`/${slug}`)}
            style={{ background: "var(--color-primary, #1B3F8B)" }}
            className="w-full py-3.5 rounded-xl text-white text-sm font-medium"
          >
            Escolher novo horário →
          </button>
        </div>
      )}

      {/* STEP — Cancelado */}
      {step === "cancelado" && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-xl">
            ✕
          </div>
          <p className="text-base font-semibold text-neutral-900">Agendamento cancelado</p>
          <p className="text-sm text-neutral-500">Até a próxima!</p>
          <button
            onClick={() => router.push(`/${slug}`)}
            style={{
              background: "var(--color-primary-light, #E8EEFB)",
              border: "1px solid var(--color-primary-border, #C5D3F0)",
              color: "var(--color-primary, #1B3F8B)",
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-medium"
          >
            Fazer novo agendamento
          </button>
        </div>
      )}
    </div>
  )
}

export default function MeusAgendamentosPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-400">Carregando...</div>}>
      <MeusAgendamentosContent />
    </Suspense>
  )
}
