import { InputHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  optional?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, optional, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-neutral-700">
          {label}
          {optional && <span className="text-neutral-500 font-normal"> (opcional)</span>}
        </label>
        <input
          ref={ref}
          className={cn(
            "rounded-sm border px-3 py-3 text-base text-neutral-900 bg-white",
            "focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary",
            "transition-colors placeholder:text-neutral-300",
            error ? "border-error" : "border-neutral-300",
            className
          )}
          {...props}
        />
        {error && <span className="text-sm text-error">{error}</span>}
      </div>
    )
  }
)

Input.displayName = "Input"
