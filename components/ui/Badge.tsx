import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-500 text-primary-foreground hover:bg-emerald-500/80"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

// FIX: The previous implementation with destructuring in the function signature was causing a subtle
// TypeScript type inference error. Taking the full props object and then destructuring inside the
// function body is a workaround that helps the type checker correctly infer the `className` and `variant` props.
function Badge(props: BadgeProps) {
  const { className, variant, ...rest } = props
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...rest} />
  )
}

export { Badge, badgeVariants }