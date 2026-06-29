"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import Link from "next/link"

export default function CancelarPage() {
  const params = useParams()
  const slug = params.slug as string

  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleCancel = async () => {
    if (!token.trim()) { setError("Informe o código do agendamento"); return }
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/${slug}/bookings/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelToken: token.toUpperCase() }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(true)
    } catch {
      setError("Erro ao cancelar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-8">
        <div className="w-14 h-14 bg-error-light rounded-full flex items-center justify-center">
          <span className="text-error text-2xl">✕</span>
        </div>
        <h2 className="text-lg font-bold text-neutral-900">Agendamento cancelado</h2>
        <p className="text-sm text-neutral-500">Até a próxima!</p>
        <Link href={`/${slug}`}>
          <Button variant="ghost" size="lg">Fazer novo agendamento</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
        Cancelar agendamento
      </p>

      <Input
        label="Código do agendamento"
        value={token}
        onChange={(e) => setToken(e.target.value.toUpperCase())}
        placeholder="Ex: A3F7XK2B"
        error={error}
      />

      <Button variant="danger" size="lg" loading={loading} onClick={handleCancel}>
        Cancelar agendamento
      </Button>

      <Link href={`/${slug}`} className="text-sm text-primary text-center">
        Voltar sem cancelar
      </Link>
    </>
  )
}
