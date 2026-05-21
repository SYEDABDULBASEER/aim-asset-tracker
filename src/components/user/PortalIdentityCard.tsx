import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortalRequester } from "@/components/user/PortalRequesterProvider";

export function PortalIdentityCard() {
  const { email, name, deskNumber, hasIdentity, setRequester, clearRequester } =
    usePortalRequester();

  const [draftEmail, setDraftEmail] = useState(email);
  const [draftName, setDraftName] = useState(name);
  const [draftDesk, setDraftDesk] = useState(deskNumber);

  useEffect(() => {
    setDraftEmail(email);
    setDraftName(name);
    setDraftDesk(deskNumber);
  }, [email, name, deskNumber]);

  if (hasIdentity) {
    return (
      <Card className="p-5 border border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Continuing as</p>
              <p className="text-sm text-foreground truncate">{name || "Employee"}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
              {deskNumber ? (
                <p className="text-xs text-muted-foreground mt-0.5">Desk {deskNumber}</p>
              ) : null}
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Tickets raised with this work email appear below. This portal does not use your IT
                Firebase account at /login.
              </p>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 mt-1.5 leading-relaxed">
                Privacy: your name and email are stored in this browser only (local storage). They
                are not sent to Firebase as an employee login. Signing out of the IT workspace in the
                same browser does not change this portal identity unless you choose “Use a different
                email.”
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={clearRequester}
          >
            Use a different email
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-primary/25 bg-primary/5">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Your work email</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Enter the email you use at work so we can show only your support requests. It is saved in
            this browser only — not a Firebase employee account.
          </p>
          <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 mt-1.5 leading-relaxed">
            IT staff sign-in at /login is separate. Your portal identity stays on this device until you
            clear it or use private browsing.
          </p>
        </div>
      </div>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmedEmail = draftEmail.trim();
          const trimmedName = draftName.trim();
          const trimmedDesk = draftDesk.trim();
          if (!trimmedEmail) return;
          setRequester({ email: trimmedEmail, name: trimmedName, deskNumber: trimmedDesk });
        }}
      >
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="portal-email">Work email</Label>
          <Input
            id="portal-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={draftEmail}
            onChange={(e) => setDraftEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="portal-name">Your name</Label>
          <Input
            id="portal-name"
            autoComplete="name"
            placeholder="Jane Smith"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="portal-desk">Desk number</Label>
          <Input
            id="portal-desk"
            placeholder="e.g. D-204"
            value={draftDesk}
            onChange={(e) => setDraftDesk(e.target.value)}
          />
        </div>
        <div className="flex items-end sm:col-span-2">
          <Button type="submit" className="w-full sm:w-auto">
            Continue to my tickets
          </Button>
        </div>
      </form>
    </Card>
  );
}
