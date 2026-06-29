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
  service: { name: string; durationMinutes: number }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export default function AgendaPage() {
  const today = new Date()
  const [date, setDate] = useState(today.toISOString().split("T")[0])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)

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
    setCancelling(id)
    try {
      await fetch(`/api/admin/bookings/${id}`, { method: "PATCH" })
      setBookings((prev) => prev.filter((b) => b.id !== id))
    } finally {
      setCancelling(null)
      setConfirmCancel(null)
    }
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
            <div key={i} className="h-24 rounded-md bg-neutral-200 animate-pulse" />
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
          <p className="text-xs font-semibold text-neutral-500 border-b border-neutral-300 pb-2">
            {bookings.length} agendamento{bookings.length > 1 ? "s" : ""}
          </p>
          {bookings.map((b) => (
            <div key={b.id} className="bg-neutral-100 border border-neutral-300 rounded-md p-4">
              {confirmCancel === b.id ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-neutral-900">
                    Cancelar agendamento de <strong>{b.clientName}</strong>?
                  </p>
                  <p className="text-xs text-neutral-500">Essa ação não pode ser desfeita.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmCancel(null)}
                      className="flex-1 text-sm text-neutral-600 border border-neutral-300 rounded-md py-2"
                    >
                      Manter
                    </button>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={cancelling === b.id}
                      onClick={() => handleCancel(b.id)}
                      className="flex-1"
                    >
                      Cancelar mesmo assim
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-primary">{formatTime(b.startTime)}</p>
                    <p className="text-base font-semibold text-neutral-900">{b.clientName}</p>
                    <p className="text-sm text-neutral-500">{b.service.name} • {b.service.durationMinutes} min</p>
                    <p className="text-sm text-neutral-500 mt-1">📱 {b.clientPhone}</p>
                  </div>
                  <button
                    onClick={() => setConfirmCancel(b.id)}
                    className="text-sm text-error font-medium hover:underline ml-4 shrink-0"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
