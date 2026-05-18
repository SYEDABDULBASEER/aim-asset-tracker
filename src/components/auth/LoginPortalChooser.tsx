import { Link } from "@tanstack/react-router";
import { Boxes, Shield, User } from "lucide-react";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import {
  STAFF_LOGIN_PATH,
  STAFF_SIGNUP_PATH,
  USER_LOGIN_PATH,
  USER_SIGNUP_PATH,
} from "@/lib/auth/routing";

export function LoginPortalChooser() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-muted/40 to-background px-4 py-12">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center">
          <Boxes className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Asset Desk</h1>
          <p className="text-sm text-muted-foreground">EClickTech Solutions</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
        Choose how you want to sign in. IT staff manage assets and tickets; employees raise
        requests and track status.
      </p>

      <div className="grid w-full max-w-2xl grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6 flex flex-col border-primary/20 hover:border-primary/40 transition-colors">
          <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-base font-semibold">IT staff</h2>
          <p className="text-xs text-muted-foreground mt-2 flex-1 leading-relaxed">
            Full access: dashboard, assets, maintenance, ticket queue, employees, vendors,
            reports, and settings.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to={STAFF_LOGIN_PATH}>IT staff sign in</Link>
          </Button>
          <p className="text-[11px] text-center text-muted-foreground mt-3">
            First admin?{" "}
            <Link to={STAFF_SIGNUP_PATH} className="text-primary hover:underline">
              Create IT staff account
            </Link>
          </p>
        </Card>

        <Card className="p-6 flex flex-col hover:border-border transition-colors">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold">Employee</h2>
          <p className="text-xs text-muted-foreground mt-2 flex-1 leading-relaxed">
            Raise support tickets and track status on your requests. No access to the IT admin
            workspace.
          </p>
          <Button asChild variant="secondary" className="mt-5 w-full">
            <Link to={USER_LOGIN_PATH}>Employee sign in</Link>
          </Button>
          <p className="text-[11px] text-center text-muted-foreground mt-3">
            New employee?{" "}
            <Link to={USER_SIGNUP_PATH} className="text-primary hover:underline">
              Create account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
