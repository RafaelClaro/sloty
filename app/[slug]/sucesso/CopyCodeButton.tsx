"use client"

import { useState } from "react"

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Fallback para ambientes sem permissão de Clipboard API
      const textarea = document.createElement("textarea")
      textarea.value = code
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1"
    >
      {copied ? "✓ Copiado!" : "📋 Copiar código"}
    </button>
  )
}
