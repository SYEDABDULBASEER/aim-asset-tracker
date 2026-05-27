import { APP_TAGLINE } from "@/lib/branding";
import { cn } from "@/lib/utils";

type AppTaglineProps = {
  className?: string;
};

export function AppTagline({ className }: AppTaglineProps) {
  return (
    <p className={cn("text-sm font-bold text-muted-foreground leading-relaxed", className)}>
      {APP_TAGLINE}
    </p>
  );
}
