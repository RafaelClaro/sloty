"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"

const DAYS = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"]
const DAYS_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]

const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) =>
  ["00", "30"].map(m => `${String(h).padStart(2, "0")}:${m}`)
).flat()

function TimeSelect({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-neutral-300 rounded-md px-2 py-1 text-xs text-neutral-700
                 bg-white focus:outline-none focus:border-primary ${className ?? "w-24"}`}
    >
      {TIME_OPTIONS.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  )
}

function Toggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${active ? "bg-primary" : "bg-neutral-300"}`}
    >
      <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all ${active ? "right-0.5" : "left-0.5"}`} />
    </button>
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
    <div className="p-4 md:p-8 flex flex-col gap-4">
      <h1 className="text-lg font-bold text-neutral-900">Horários de funcionamento</h1>

      {loading ? (
        <div className="flex flex-col gap-3">
          {DAYS.map((_, i) => <div key={i} className="h-14 rounded-md bg-neutral-200 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Mobile — lista vertical */}
          <div className="md:hidden bg-neutral-100 border border-neutral-300 rounded-md divide-y divide-neutral-300">
            {rules.map((rule, i) => (
              <div key={i} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-900">{DAYS[rule.dayOfWeek]}</span>
                  <Toggle active={rule.active} onChange={() => update(i, "active", !rule.active)} />
                </div>
                {rule.active ? (
                  <div className="flex gap-2 items-center">
                    <TimeSelect value={rule.startTime} onChange={(v) => update(i, "startTime", v)} />
                    <span className="text-xs text-neutral-500">até</span>
                    <TimeSelect value={rule.endTime} onChange={(v) => update(i, "endTime", v)} />
                  </div>
                ) : (
                  <span className="text-xs font-medium text-error">Fechado</span>
                )}
              </div>
            ))}
          </div>

          {/* Desktop — grid 7 colunas */}
          <div className="hidden md:grid grid-cols-7 gap-4 bg-white border border-neutral-200 rounded-xl p-6">
            {rules.map((rule, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <p className={`text-sm font-semibold ${rule.active ? "text-neutral-700" : "text-neutral-400"}`}>
                  {DAYS_SHORT[rule.dayOfWeek]}
                </p>
                <Toggle active={rule.active} onChange={() => update(i, "active", !rule.active)} />
                {rule.active ? (
                  <div className="flex flex-col gap-2 w-full">
                    <TimeSelect value={rule.startTime} onChange={(v) => update(i, "startTime", v)} className="w-full" />
                    <TimeSelect value={rule.endTime} onChange={(v) => update(i, "endTime", v)} className="w-full" />
                  </div>
                ) : (
                  <p className="text-xs font-medium text-error">Fechado</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Button variant="primary" size="lg" loading={saving} onClick={handleSave} className="w-full md:w-80">
        {saved ? "✓ Salvo!" : "Salvar horários"}
      </Button>
    </div>
  )
}
