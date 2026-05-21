import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import type { TicketPriority } from "@/lib/models";
import { callEmployeePortalServerFn } from "@/lib/auth/authenticated-server-fn";
import { createUserTicket } from "@/utils/tickets.functions";
import { usePortalRequester } from "@/components/user/PortalRequesterProvider";

const PRIORITIES: TicketPriority[] = ["Critical", "High", "Medium", "Low"];

type RaiseTicketFormProps = {
  onSubmitted?: (ticketId: string) => void;
  showIdentityFields?: boolean;
};

export function RaiseTicketForm({ onSubmitted, showIdentityFields = true }: RaiseTicketFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { email, name, deskNumber, setRequester, hasIdentity } = usePortalRequester();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requesterName, setRequesterName] = useState(name);
  const [requesterEmail, setRequesterEmail] = useState(email);
  const [desk, setDesk] = useState(deskNumber);
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [assetId, setAssetId] = useState("");

  useEffect(() => {
    if (name) setRequesterName(name);
    if (email) setRequesterEmail(email);
    if (deskNumber) setDesk(deskNumber);
  }, [name, email, deskNumber]);

  const submitMut = useMutation({
    mutationFn: () => {
      const trimmedEmail = requesterEmail.trim();
      const trimmedName = requesterName.trim();
      const trimmedDesk = desk.trim();
      if (!trimmedEmail) {
        throw new Error("Work email is required so you can track this request later.");
      }
      if (!trimmedName) {
        throw new Error("Your name is required.");
      }
      if (!trimmedDesk) {
        throw new Error("Desk number is required so IT can find you.");
      }
      return callEmployeePortalServerFn(createUserTicket, {
        data: {
          title: title.trim(),
          description: description.trim(),
          requesterName: trimmedName,
          requesterEmail: trimmedEmail,
          deskNumber: trimmedDesk,
          priority,
          assetId: assetId.trim() || undefined,
        },
      });
    },
    onSuccess: (ticket) => {
      const trimmedEmail = requesterEmail.trim();
      const trimmedName = requesterName.trim();
      const trimmedDesk = desk.trim();
      setRequester({ email: trimmedEmail, name: trimmedName, deskNumber: trimmedDesk });
      void queryClient.invalidateQueries({ queryKey: ["my-user-tickets"] });
      toast.success("Ticket submitted", {
        description: `${ticket.id} is Open. You can track it under My requests.`,
      });
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setAssetId("");
      onSubmitted?.(ticket.id);
      void navigate({ to: "/user/tickets/$id", params: { id: ticket.id } });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not submit your request.");
    },
  });

  return (
    <Card className="p-6 shadow-soft border-border/80">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submitMut.mutate();
        }}
      >
        {showIdentityFields ? (
          <>
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
              <Label htmlFor="rs-email">Work email</Label>
              <Input
                id="rs-email"
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
              {!hasIdentity ? (
                <p className="text-[11px] text-muted-foreground">
                  Use the same email each time to see all your tickets in one list.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-desk">Desk number</Label>
              <Input
                id="rs-desk"
                value={desk}
                onChange={(e) => setDesk(e.target.value)}
                placeholder="e.g. D-204, Floor 3"
                required
                maxLength={50}
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="rs-desk">Desk number</Label>
            <Input
              id="rs-desk"
              value={desk}
              onChange={(e) => setDesk(e.target.value)}
              placeholder="e.g. D-204, Floor 3"
              required
              maxLength={50}
            />
          </div>
        )}

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
            "Submit ticket"
          )}
        </Button>
      </form>
    </Card>
  );
}
