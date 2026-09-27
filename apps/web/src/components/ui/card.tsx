import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Rounded-2xl, not a pill — X reserves the full pill shape for buttons.
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-background p-6",
        className
      )}
      {...props}
    />
  );
}
