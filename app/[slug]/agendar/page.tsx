"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { Button } from "@/components/ui/Button"

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"]
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

interface Slot { time: string; available: boolean }

export default function AgendarPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const serviceId = searchParams.get("serviceId") ?? ""
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

  useEffect(() => { fetchDays() }, [fetchDays])
  useEffect(() => { if (selectedDay) fetchSlots(selectedDay) }, [selectedDay, fetchSlots])

  const handleNext = () => {
    if (!selectedDay || !selectedSlot) return
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    router.push(`/${slug}/confirmar?serviceId=${serviceId}&date=${date}&time=${selectedSlot}`)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calCells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  return (
    <>
      <button
        onClick={() => router.push(`/${slug}`)}
        className="flex items-center gap-2 text-primary text-sm font-medium pb-3 border-b border-neutral-300"
      >
        ← Voltar
      </button>

      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Escolha uma data</p>

      <div className="border border-neutral-300 rounded-md overflow-hidden bg-neutral-100">
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-300">
          <button
            onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
            className="text-neutral-500 text-lg px-2"
          >‹</button>
          <span className="text-sm font-semibold text-neutral-900">{MONTHS[month]} {year}</span>
          <button
            onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
            className="text-neutral-500 text-lg px-2"
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
                className={`text-center py-2 text-xs mx-0.5 my-0.5 rounded-full transition-colors
                  ${!day ? "invisible" : ""}
                  ${isSelected ? "bg-primary text-white font-bold" : ""}
                  ${isAvailable && !isSelected ? "text-neutral-900 font-medium cursor-pointer hover:bg-primary-light hover:text-primary" : ""}
                  ${!isAvailable && day ? "text-neutral-300 cursor-default" : ""}
                  ${isToday && !isSelected ? "text-primary font-bold" : ""}
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
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-8 w-16 rounded-md bg-neutral-200 animate-pulse" />)}
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
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-all
                    ${selectedSlot === slot.time ? "bg-primary text-white border-primary" : ""}
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
