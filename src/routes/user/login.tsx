import { createFileRoute, Navigate } from "@tanstack/react-router";

import { USER_HOME_PATH } from "@/lib/auth/routing";

export const Route = createFileRoute("/user/login")({
  head: () => ({ meta: [{ title: "Employee portal — Asset Desk" }] }),
  component: UserLoginRedirect,
});

/** Employees use the portal with work email on this device only — no account sign-in. */
function UserLoginRedirect() {
  return <Navigate to={USER_HOME_PATH} replace />;
}
