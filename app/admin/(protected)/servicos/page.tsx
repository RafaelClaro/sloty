"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatCurrency } from "@/lib/utils"

interface Service {
  id: string
  name: string
  durationMinutes: number
  price: string
  description?: string
}

interface ServiceForm {
  name: string
  durationMinutes: string
  price: string
  description: string
}

const EMPTY_FORM: ServiceForm = { name: "", durationMinutes: "", price: "", description: "" }

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchServices = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/services")
    const data = await res.json()
    setServices(data.services ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchServices() }, [])

  const handleSave = async () => {
    if (!form.name || !form.durationMinutes || !form.price) return
    setSaving(true)

    const payload = {
      name: form.name,
      durationMinutes: parseInt(form.durationMinutes),
      price: parseFloat(form.price.replace(",", ".")),
      description: form.description || undefined,
    }

    if (editing) {
      await fetch(`/api/admin/services/${editing}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    }

    setSaving(false)
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    fetchServices()
  }

  const handleEdit = (service: Service) => {
    setEditing(service.id)
    setForm({
      name: service.name,
      durationMinutes: String(service.durationMinutes),
      price: Number(service.price).toFixed(2).replace(".", ","),
      description: service.description ?? "",
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" })
    setConfirmDelete(null)
    fetchServices()
  }

  return (
    <div className="p-4 md:p-8 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold text-neutral-900">Serviços</h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_FORM) }}
        >
          + Adicionar
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-neutral-300 rounded-md p-4 flex flex-col gap-3 shadow-card">
          <p className="text-sm font-semibold text-neutral-900">
            {editing ? "Editar serviço" : "Novo serviço"}
          </p>
          <Input label="Nome do serviço" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Consulta Inicial" />
          <Input label="Duração (minutos)" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} placeholder="60" />
          <Input label="Preço (R$)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="300,00" />
          <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opcional" optional />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM) }}
              className="flex-1 text-sm text-neutral-600 border border-neutral-300 rounded-md py-2"
            >
              Cancelar
            </button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave} className="flex-1">
              Salvar
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-md bg-neutral-200 animate-pulse" />)}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={<span className="text-5xl">📋</span>}
          title="Nenhum serviço cadastrado"
          hint="Adicione seus serviços para começar a receber agendamentos."
          cta={{ label: "Adicionar serviço", onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((s) => (
            <div key={s.id} className="bg-neutral-100 border border-neutral-300 rounded-md p-4">
              {confirmDelete === s.id ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-neutral-900">Excluir <strong>{s.name}</strong>?</p>
                  <p className="text-xs text-neutral-500">Agendamentos futuros não serão afetados.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 text-sm text-neutral-600 border border-neutral-300 rounded-md py-2">Manter</button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)} className="flex-1">Excluir</Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{s.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{s.durationMinutes} min • {formatCurrency(Number(s.price))}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => handleEdit(s)} className="border border-neutral-300 rounded-md w-8 h-8 flex items-center justify-center text-sm hover:border-neutral-500 transition-colors">✏️</button>
                    <button onClick={() => setConfirmDelete(s.id)} className="border border-neutral-300 rounded-md w-8 h-8 flex items-center justify-center text-sm hover:border-error transition-colors">🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
