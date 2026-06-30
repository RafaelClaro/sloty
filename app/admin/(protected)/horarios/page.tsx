"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"

const DAYS = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"]

const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) =>
  ["00", "30"].map(m => `${String(h).padStart(2, "0")}:${m}`)
).flat()

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-neutral-300 rounded-md px-2 py-1 text-xs text-neutral-700
                 bg-white focus:outline-none focus:border-primary w-24"
    >
      {TIME_OPTIONS.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  )
}

interface Rule {
  dayOfWeek: number
  startTime: string
  endTime: string
  active: boolean
}

const DEFAULT_RULES: Rule[] = DAYS.map((_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "18:00",
  active: i >= 1 && i <= 5,
}))

export default function HorariosPage() {
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/admin/availability-rules")
      .then((r) => r.json())
      .then((data) => {
        if (data.rules?.length > 0) {
          const merged = DEFAULT_RULES.map((def) => {
            const found = data.rules.find((r: Rule) => r.dayOfWeek === def.dayOfWeek)
            return found ?? def
          })
          setRules(merged)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const update = (index: number, field: keyof Rule, value: string | boolean) => {
    setRules((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch("/api/admin/availability-rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-lg font-bold text-neutral-900">Horários de funcionamento</h1>

      {loading ? (
        <div className="flex flex-col gap-3">
          {DAYS.map((_, i) => <div key={i} className="h-14 rounded-md bg-neutral-200 animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-neutral-100 border border-neutral-300 rounded-md divide-y divide-neutral-300">
          {rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="text-sm font-medium text-neutral-900 w-20 shrink-0">{DAYS[rule.dayOfWeek]}</span>

              {rule.active ? (
                <div className="flex gap-2 flex-1 items-center">
                  <TimeSelect value={rule.startTime} onChange={(v) => update(i, "startTime", v)} />
                  <span className="text-xs text-neutral-500">até</span>
                  <TimeSelect value={rule.endTime} onChange={(v) => update(i, "endTime", v)} />
                </div>
              ) : (
                <span className="flex-1 text-xs font-medium text-error">Fechado</span>
              )}

              <button
                onClick={() => update(i, "active", !rule.active)}
                className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${rule.active ? "bg-primary" : "bg-neutral-300"}`}
              >
                <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all ${rule.active ? "right-0.5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button variant="primary" size="lg" loading={saving} onClick={handleSave}>
        {saved ? "✓ Salvo!" : "Salvar horários"}
      </Button>
    </div>
  )
}
