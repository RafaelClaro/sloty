interface ProgressBarProps {
  step: 1 | 2 | 3 // 1=serviços, 2=data, 3=confirmar
}

export function ProgressBar({ step }: ProgressBarProps) {
  const percent = Math.round((step / 3) * 100)
  return (
    <div className="h-1 w-full bg-neutral-200">
      <div
        className="h-1 bg-secondary transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
