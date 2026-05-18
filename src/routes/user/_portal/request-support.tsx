import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Boxes, Loader2 } from "lucide-react";
import type { TicketPriority } from "@/lib/models";
import { STAFF_LOGIN_PATH, USER_HOME_PATH } from "@/lib/auth/routing";
import { firebaseAuthRequired } from "@/lib/firebase/env";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { createUserTicket } from "@/utils/tickets.functions";

export const Route = createFileRoute("/user/_portal/request-support")({
  head: () => ({ meta: [{ title: "Report an issue — Asset Desk" }] }),
  component: RequestSupportPage,
});

const PRIORITIES: TicketPriority[] = ["Critical", "High", "Medium", "Low"];

function RequestSupportPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authRequired = firebaseAuthRequired();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [assetId, setAssetId] = useState("");

  useEffect(() => {
    if (!auth.user) return;
    if (auth.user.email) setRequesterEmail(auth.user.email);
    const name = auth.user.displayName?.trim();
    if (name) setRequesterName(name);
  }, [auth.user]);

  const submitMut = useMutation({
    mutationFn: () =>
      callAuthenticatedServerFn(createUserTicket, {
        data: {
          title: title.trim(),
          description: description.trim(),
          requesterName: requesterName.trim(),
          requesterEmail: requesterEmail.trim() || "",
          priority,
          assetId: assetId.trim() || undefined,
        },
      }),
    onSuccess: (ticket) => {
      void queryClient.invalidateQueries({ queryKey: ["my-user-tickets"] });
      toast.success("Request submitted", {
        description: `${ticket.id} is Open — view it under My requests on the portal home.`,
      });
      if (auth.user) {
        void navigate({ to: "/user/tickets/$id", params: { id: ticket.id } });
      }
      setTitle("");
      setDescription("");
      if (!auth.user) {
        setRequesterName("");
        setRequesterEmail("");
      }
      setPriority("Medium");
      setAssetId("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not submit your request.");
    },
  });

  return (
    <div className="px-4 py-8 max-w-lg mx-auto space-y-8">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Boxes className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Report an issue</h1>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Describe the problem and we will open a service ticket for IT.{" "}
            {authRequired
              ? "Sign in with your employee account to track status on the portal home page."
              : "Use the same email you sign in with to see status under My requests."}
          </p>
          {authRequired && !auth.user ? (
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link to="/user/login">Sign in to track tickets</Link>
            </Button>
          ) : null}
        </div>

        <Card className="p-6 shadow-soft border-border/80">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitMut.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="rs-name">Your name</Label>
              <Input
                id="rs-name"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="e.g. Jane Smith"
                required
                minLength={2}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-email">
                Work email{authRequired ? "" : " (optional)"}
              </Label>
              <Input
                id="rs-email"
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required={authRequired}
                readOnly={Boolean(auth.user?.email)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-title">Short summary</Label>
              <Input
                id="rs-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is going wrong?"
                required
                minLength={5}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-desc">Details</Label>
              <Textarea
                id="rs-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened, when, and any error messages or asset tag if you know it."
                required
                minLength={10}
                rows={5}
                className="resize-y min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rs-asset">Asset ID (optional)</Label>
                <Input
                  id="rs-asset"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="e.g. LAP-0001"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitMut.isPending}>
              {submitMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting…
                </>
              ) : (
                "Submit request"
              )}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <Link to={USER_HOME_PATH} className="text-primary font-medium hover:underline">
            My requests
          </Link>
          {" · "}
          IT staff{" "}
          <Link to={STAFF_LOGIN_PATH} className="text-primary font-medium hover:underline">
            admin sign in
          </Link>
        </p>
    </div>
  );
}
