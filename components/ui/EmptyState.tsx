import { ReactNode } from "react"
import { Button } from "./Button"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  hint: string
  cta?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, hint, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-16 px-6">
      {icon && <div className="text-neutral-300 w-12 h-12">{icon}</div>}
      <p className="text-lg font-medium text-neutral-700">{title}</p>
      <p className="text-sm text-neutral-500">{hint}</p>
      {cta && (
        <Button variant="primary" size="md" onClick={cta.onClick}>
          {cta.label}
        </Button>
      )}
    </div>
  )
}
