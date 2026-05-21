import { createFileRoute } from "@tanstack/react-router";

import { StaffLoginPage } from "@/components/auth/EmailPasswordAuthPage";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "IT sign in — Asset Desk" }] }),
  component: StaffLoginPage,
});
