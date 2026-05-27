import { APP_LOGO_SRC, APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
  alt?: string;
};

export function AppLogo({ className, alt = APP_NAME }: AppLogoProps) {
  return (
    <img
      src={APP_LOGO_SRC}
      alt={alt}
      className={cn("object-contain", className)}
      decoding="async"
    />
  );
}
