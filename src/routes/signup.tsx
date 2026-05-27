import { createFileRoute, Navigate } from "@tanstack/react-router";

import { STAFF_LOGIN_PATH } from "@/lib/auth/routing";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — AssetSphere" }] }),
  component: StaffSignupRedirect,
});

/** IT accounts are provisioned by an administrator; public self-signup is disabled. */
function StaffSignupRedirect() {
  return <Navigate to={STAFF_LOGIN_PATH} replace />;
}
