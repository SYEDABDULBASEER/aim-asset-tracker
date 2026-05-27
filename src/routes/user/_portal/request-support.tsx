import { createFileRoute, Navigate } from "@tanstack/react-router";
import { USER_HOME_PATH } from "@/lib/auth/routing";

export const Route = createFileRoute("/user/_portal/request-support")({
  head: () => ({ meta: [{ title: "Report an issue — AssetSphere" }] }),
  component: () => <Navigate to={USER_HOME_PATH} replace />,
});
