import { APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

type AppBrandNameProps = {
  className?: string;
  /** Use on dark sidebar / navy backgrounds */
  variant?: "default" | "on-dark";
};

export function AppBrandName({ className, variant = "default" }: AppBrandNameProps) {
  return (
    <span className={cn(variant === "on-dark" ? "text-brand-light" : "text-brand", className)}>
      {APP_NAME}
    </span>
  );
}
