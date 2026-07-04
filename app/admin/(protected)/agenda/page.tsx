"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"

interface Booking {
  id: string
  startTime: string
  endTime: string
  clientName: string
  clientPhone: string
  reason: string | null
  service: { name: string; durationMinutes: number }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function PatientNotes({ phone }: { phone: string }) {
  const [notes, setNotes] = useState("")
  const [saved, setSaved] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/patients/notes?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((d) => {
        setNotes(d.notes ?? "")
        setSaved(d.notes ?? "")
      })
      .finally(() => setLoading(false))
  }, [phone])

  const handleSave = async () => {
    setSaving(true)
    await fetch("/api/admin/patients/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, notes }),
    })
    setSaved(notes)
    setSaving(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  const dirty = notes !== saved

  if (loading) return <div className="h-16 bg-neutral-100 rounded-lg animate-pulse" />

  return (
    <div>
      <p
        className="uppercase font-semibold"
        style={{ fontSize: 11, color: "#9CA3AF", letterSpacing: "0.06em", marginBottom: 6 }}
      >
        Anotações
      </p>
      <textarea
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={"Ex: 15/07 · retorno positivo\n16/07 · encaminhou para exames"}
        style={{
          width: "100%",
          background: "#F9FAF8",
          border: "1px solid #E5E7EB",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 13,
          color: "#374151",
          lineHeight: 1.6,
          resize: "none",
          fontFamily: "inherit",
          boxSizing: "border-box",
          outline: "none",
        }}
        onFocus={(e) => { e.target.style.borderColor = "#74C69D"; e.target.style.boxShadow = "0 0 0 2px #D1FAE5" }}
        onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none" }}
      />
      <div className="flex items-center justify-between mt-1.5">
        <span style={{ fontSize: 11, color: justSaved ? "#2D6A4F" : "transparent" }}>
          ✓ Salvo
        </span>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: saving ? "#9CA3AF" : "#2D6A4F",
              background: "none",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              padding: 0,
            }}
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        )}
      </div>
    </div>
  )
}

function BookingCard({
  b,
  onCancel,
}: {
  b: Booking
  onCancel: (id: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    setCancelling(true)
    await onCancel(b.id)
    setCancelling(false)
    setConfirmCancel(false)
  }

  return (
    <div
      className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      {/* Header — sempre visível */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-primary">{formatTime(b.startTime)}</span>
            {b.reason && (
              <span
                style={{
                  background: "#F0FDF4",
                  color: "#2D6A4F",
                  border: "1px solid #D1FAE5",
                  borderRadius: 6,
                  fontSize: 10,
                  padding: "1px 6px",
                  fontWeight: 500,
                }}
              >
                Motivo informado
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-neutral-900 mt-0.5">{b.clientName}</p>
          <p className="text-sm text-neutral-500">{b.service.name} · {b.service.durationMinutes} min</p>
          <p className="text-sm text-neutral-500 mt-1">📱 {b.clientPhone}</p>
        </div>
        <span
          className="text-neutral-400 text-lg shrink-0 mt-0.5 transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}
        >
          ⌄
        </span>
      </button>

      {/* Conteúdo expandido */}
      {expanded && (
        <div className="border-t border-neutral-100 px-4 pb-4 pt-3 flex flex-col gap-4">
          {/* Motivo da consulta */}
          <div>
            <p
              className="uppercase font-semibold"
              style={{ fontSize: 11, color: "#9CA3AF", letterSpacing: "0.06em", marginBottom: 6 }}
            >
              Motivo da consulta
            </p>
            {b.reason ? (
              <div
                style={{
                  background: "#F9FAF8",
                  border: "1px solid #F3F4F6",
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{b.reason}</p>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#D1D5DB", fontStyle: "italic" }}>
                Paciente não informou o motivo.
              </p>
            )}
          </div>

          {/* Anotações livres */}
          <PatientNotes phone={b.clientPhone} />

          {/* Cancelamento inline */}
          {confirmCancel ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-neutral-900">
                Cancelar agendamento de <strong>{b.clientName}</strong>?
              </p>
              <p className="text-xs text-neutral-500">Essa ação não pode ser desfeita.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 text-sm text-neutral-600 border border-neutral-300 rounded-md py-2"
                >
                  Manter
                </button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={cancelling}
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancelar mesmo assim
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmCancel(true)}
              className="text-sm text-error font-medium hover:underline text-left"
            >
              Cancelar agendamento
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function AgendaPage() {
  const today = new Date()
  const [date, setDate] = useState(today.toISOString().split("T")[0])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/agenda?date=${date}`)
      const data = await res.json()
      setBookings(data.bookings ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [date])

  const handleCancel = async (id: string) => {
    await fetch(`/api/admin/bookings/${id}`, { method: "PATCH" })
    setBookings((prev) => prev.filter((b) => b.id !== id))
  }

  const dateLabel = new Date(`${date}T12:00`).toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  })

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Agenda</h1>
          <p className="text-sm text-neutral-500 capitalize">{dateLabel}</p>
        </div>
        <span className="bg-primary-light text-primary-dark text-xs font-semibold px-2 py-1 rounded-full">
          {date === today.toISOString().split("T")[0] ? "Hoje" : ""}
        </span>
      </div>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border border-neutral-300 rounded-md px-3 py-2 text-sm text-neutral-700 bg-white focus:outline-none focus:border-primary"
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-neutral-200 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<span className="text-5xl">📅</span>}
          title="Nenhum agendamento"
          hint="Compartilhe seu link para receber agendamentos."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-neutral-500 border-b border-neutral-200 pb-2">
            {bookings.length} agendamento{bookings.length > 1 ? "s" : ""}
          </p>
          {bookings.map((b) => (
            <BookingCard key={b.id} b={b} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  )
}
