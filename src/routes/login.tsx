import { createFileRoute } from "@tanstack/react-router";

import { StaffLoginPage } from "@/components/auth/EmailPasswordAuthPage";
type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect:
      typeof search.redirect === "string" && search.redirect.startsWith("/admin")
        ? search.redirect
        : undefined,
  }),
  head: () => ({ meta: [{ title: "IT sign in — Asset Desk" }] }),
  component: StaffLoginPage,
});
