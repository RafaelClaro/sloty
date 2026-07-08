"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { Button } from "@/components/ui/Button"

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"]
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

interface Slot { time: string; available: boolean }

function AgendarContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const serviceId = searchParams.get("serviceId") ?? ""
  const serviceName = searchParams.get("serviceName") ?? ""
  const serviceDuration = searchParams.get("serviceDuration") ?? ""
  const servicePrice = searchParams.get("servicePrice") ?? ""
  const serviceLabel = searchParams.get("serviceLabel") ?? ""
  const slug = params.slug as string

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [availableDays, setAvailableDays] = useState<number[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingDays, setLoadingDays] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)

  const fetchDays = useCallback(async () => {
    setLoadingDays(true)
    try {
      const res = await fetch(`/api/${slug}/availability?month=${month}&year=${year}`)
      const data = await res.json()
      setAvailableDays(data.days ?? [])
    } finally {
      setLoadingDays(false)
    }
  }, [slug, month, year])

  const fetchSlots = useCallback(async (day: number) => {
    if (!serviceId) return
    setLoadingSlots(true)
    setSlots([])
    try {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const res = await fetch(`/api/${slug}/availability?serviceId=${serviceId}&date=${date}`)
      const data = await res.json()
      setSlots(data.slots ?? [])
    } finally {
      setLoadingSlots(false)
    }
  }, [slug, serviceId, year, month])

  useEffect(() => {
    setSelectedDay(null)
    setSlots([])
    setSelectedSlot(null)
    fetchDays()
  }, [fetchDays])

  useEffect(() => {
    if (availableDays.length > 0 && selectedDay === null) {
      setSelectedDay(availableDays[0])
    }
  }, [availableDays])

  useEffect(() => { if (selectedDay) fetchSlots(selectedDay) }, [selectedDay, fetchSlots])

  const handleNext = () => {
    if (!selectedDay || !selectedSlot) return
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    const dateLabel = new Date(`${date}T12:00`).toLocaleDateString("pt-BR", {
      weekday: "short", day: "numeric", month: "short",
    })
    router.push(
      `/${slug}/confirmar?serviceId=${serviceId}&serviceName=${encodeURIComponent(serviceName)}&serviceDuration=${serviceDuration}&servicePrice=${encodeURIComponent(servicePrice)}&serviceLabel=${encodeURIComponent(serviceLabel)}&date=${date}&time=${selectedSlot}&dateLabel=${encodeURIComponent(`${dateLabel} · ${selectedSlot}`)}`
    )
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calCells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  return (
    <>
      {/* Contexto acumulado */}
      {serviceName && (
        <div className="bg-primary-light border border-primary rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-dark">{serviceName}</p>
            {serviceLabel && <p className="text-xs text-primary mt-0.5">{serviceLabel}</p>}
          </div>
          <button
            onClick={() => router.push(`/${slug}`)}
            className="text-xs font-semibold text-primary underline hover:text-primary-dark ml-4 shrink-0"
          >
            Trocar
          </button>
        </div>
      )}

      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Escolha uma data</p>

      <div className="border border-neutral-300 rounded-2xl overflow-hidden bg-white shadow-card">
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-100 bg-neutral-100">
          <button
            onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 hover:bg-white hover:text-primary transition-colors"
          >‹</button>
          <span className="text-sm font-semibold text-neutral-900">{MONTHS[month]} {year}</span>
          <button
            onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 hover:bg-white hover:text-primary transition-colors"
          >›</button>
        </div>
        <div className="grid grid-cols-7 p-2">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-xs font-semibold text-neutral-500 py-2">{d}</div>
          ))}
          {calCells.map((day, i) => {
            const isAvailable = day && availableDays.includes(day)
            const isSelected = day === selectedDay
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            return (
              <div
                key={i}
                onClick={() => isAvailable && setSelectedDay(day)}
                className={`text-center py-2 text-xs mx-0.5 my-0.5 rounded-full transition-all
                  ${!day ? "invisible" : ""}
                  ${isSelected ? "bg-primary text-white font-bold shadow-card scale-105" : ""}
                  ${isAvailable && !isSelected ? "text-neutral-900 font-medium cursor-pointer hover:bg-primary-light hover:text-primary" : ""}
                  ${!isAvailable && day ? "text-neutral-300 cursor-default" : ""}
                  ${isToday && !isSelected && isAvailable ? "text-primary font-bold ring-1 ring-primary/40" : ""}
                `}
              >
                {day ?? ""}
              </div>
            )
          })}
        </div>
      </div>

      {selectedDay && (
        <>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Horários disponíveis</p>
          {loadingSlots ? (
            <div className="flex gap-2 flex-wrap">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-9 w-16 rounded-full bg-neutral-200 animate-pulse" />)}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum horário disponível para este dia.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
                    ${selectedSlot === slot.time ? "bg-primary text-white border-primary shadow-card" : ""}
                    ${slot.available && selectedSlot !== slot.time ? "bg-white text-neutral-700 border-neutral-300 hover:border-primary hover:text-primary" : ""}
                    ${!slot.available ? "opacity-40 cursor-not-allowed bg-neutral-100 text-neutral-300 border-neutral-100" : ""}
                  `}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          disabled={!selectedDay || !selectedSlot}
          onClick={handleNext}
        >
          Próximo →
        </Button>
      </div>
    </>
  )
}

export default function AgendarPage() {
  return (
    <Suspense>
      <AgendarContent />
    </Suspense>
  )
}
