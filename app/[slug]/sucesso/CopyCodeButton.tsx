"use client"

import { useState } from "react"

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <p style={{ fontSize: 15, fontWeight: 600, letterSpacing: "2.5px", color: "var(--color-primary-dark, #1B4332)", margin: 0, fontFamily: "monospace" }}>
        {code}
      </p>
      <button
        onClick={handleCopy}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 2,
          opacity: copied ? 1 : 0.45,
          color: copied ? "var(--color-primary)" : "var(--color-primary-dark, #1B4332)",
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        {copied ? "✓" : "⧉"}
      </button>
    </div>
  )
}
