import { createFileRoute, Navigate } from "@tanstack/react-router";

import { USER_HOME_PATH } from "@/lib/auth/routing";

export const Route = createFileRoute("/user/signup")({
  head: () => ({ meta: [{ title: "Employee portal — Asset Desk" }] }),
  component: UserSignupRedirect,
});

function UserSignupRedirect() {
  return <Navigate to={USER_HOME_PATH} replace />;
}
