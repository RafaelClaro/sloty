"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { setError("Preencha e-mail e senha"); return }
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email, password, redirect: false,
    })

    if (result?.error) {
      setError("E-mail ou senha incorretos")
      setLoading(false)
      return
    }

    router.push("/admin/agenda")
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-300 rounded-md shadow-card p-6 w-full max-w-sm flex flex-col gap-5">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-primary text-xl">📅</span>
          </div>
          <h1 className="text-lg font-bold text-neutral-900">Painel Admin</h1>
          <p className="text-sm text-neutral-500 mt-1">Acesse sua agenda</p>
        </div>

        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
        <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

        {error && <p className="text-sm text-error">{error}</p>}

        <Button variant="primary" size="lg" loading={loading} onClick={handleLogin}>
          Entrar
        </Button>
      </div>
    </div>
  )
}
