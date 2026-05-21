import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Clock,
  Paperclip,
  MessageSquare,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/models";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { useCanWriteTickets } from "@/lib/auth/AuthProvider";
import {
  listTickets,
  getTicketById,
  createTicket,
  updateTicket,
  updateTicketStatus,
  addTicketComment,
} from "@/utils/tickets.functions";
import { listAssets } from "@/utils/assets.functions";

export const Route = createFileRoute("/admin/tickets")({
  head: () => ({ meta: [{ title: "Tickets — Asset Desk" }] }),
  component: Tickets,
});

const COLS: TicketStatus[] = ["Open", "In Progress", "Waiting Parts", "Resolved", "Closed"];

const PRIORITIES: TicketPriority[] = ["Critical", "High", "Medium", "Low"];

function priorityTone(p: string) {
  const v =
    p === "Critical" ? "danger" : p === "High" ? "warning" : p === "Medium" ? "info" : "muted";
  return (v satisfies Parameters<typeof StatusPill>[0]["tone"]) ? v : "muted";
}

function statusTone(s: string) {
  const v =
    s === "Resolved"
      ? "success"
      : s === "Open" || s === "In Progress"
        ? "info"
        : s === "Waiting Parts"
          ? "warning"
          : s === "Closed"
            ? "muted"
            : "info";
  return (v satisfies Parameters<typeof StatusPill>[0]["tone"]) ? v : "info";
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function isTerminal(s: string) {
  return s === "Resolved" || s === "Closed";
}

function slaLabel(t: Pick<Ticket, "status" | "slaDueAt">) {
  if (isTerminal(t.status)) return "Met";
  if (!t.slaDueAt) return "—";
  const due = new Date(t.slaDueAt);
  if (Number.isNaN(due.getTime())) return "—";
  const now = Date.now();
  if (due.getTime() < now) return "Breached";
  return formatDistanceToNow(due, { addSuffix: true });
}

function TicketStatusSelect({
  ticketId,
  value,
  disabled,
  onChange,
  compact,
}: {
  ticketId: string;
  value: TicketStatus;
  disabled?: boolean;
  onChange: (id: string, status: TicketStatus) => void;
  compact?: boolean;
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(v) => onChange(ticketId, v as TicketStatus)}
    >
      <SelectTrigger
        className={compact ? "h-8 w-[140px] text-xs border-border/60" : "h-9 border-none bg-muted/40 hover:bg-muted/60 transition focus:ring-0 focus:ring-offset-0 px-3"}
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {COLS.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Tickets() {
  const queryClient = useQueryClient();
  const canEditTickets = useCanWriteTickets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formAssetId, setFormAssetId] = useState<string>("");
  const [formPriority, setFormPriority] = useState<TicketPriority>("Medium");
  const [formRequester, setFormRequester] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentBody, setCommentBody] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<TicketPriority>("Medium");
  const [editAssignee, setEditAssignee] = useState("");
  const [editRequester, setEditRequester] = useState("");
  const [editAssetId, setEditAssetId] = useState("");

  const { data: listRes, isLoading: listLoading } = useQuery({
    queryKey: ["tickets", "list"],
    queryFn: () => callAuthenticatedServerFn(listTickets, { data: { limit: 500, offset: 0 } }),
  });

  const items = useMemo(() => listRes?.items ?? [], [listRes]);

  const effectiveSelected = selectedId;

  useEffect(() => {
    if (selectedId && items.length && !items.some((i) => i.id === selectedId)) {
      setSelectedId(items[0]?.id ?? null);
    }
  }, [selectedId, items]);

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["tickets", "detail", effectiveSelected],
    queryFn: () => callAuthenticatedServerFn(getTicketById, { data: { id: effectiveSelected! } }),
    enabled: Boolean(effectiveSelected),
  });

  useEffect(() => {
    if (!detail) return;
    setEditTitle(detail.title);
    setEditPriority(detail.priority);
    setEditAssignee(detail.assigneeName ?? "");
    setEditRequester(detail.requesterName ?? "");
    setEditAssetId(detail.assetId ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset form when ticket id or server revision changes
  }, [detail?.id, detail?.updatedAt]);

  const detailsDirty = useMemo(() => {
    if (!detail) return false;
    const asset = editAssetId.trim() || null;
    const assignee = editAssignee.trim() || null;
    const requester = editRequester.trim() || null;
    return (
      editTitle.trim() !== detail.title ||
      editPriority !== detail.priority ||
      assignee !== (detail.assigneeName ?? null) ||
      requester !== (detail.requesterName ?? null) ||
      asset !== (detail.assetId ?? null)
    );
  }, [detail, editTitle, editPriority, editAssignee, editRequester, editAssetId]);

  const detailLocked = useMemo(() => detail?.status === "Closed", [detail?.status]);

  const { data: assetsRes } = useQuery({
    queryKey: ["assets", "pick", "tickets"],
    queryFn: () => callAuthenticatedServerFn(listAssets, { data: { limit: 200, offset: 0 } }),
  });
  const assetOptions = assetsRes?.items ?? [];

  const invalidateTickets = () => {
    void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      callAuthenticatedServerFn(createTicket, {
        data: {
          title: formTitle.trim(),
          assetId: formAssetId.trim() || null,
          priority: formPriority,
          requesterName: formRequester.trim(),
          assigneeName: formAssignee.trim() || null,
          description: formDescription.trim() || undefined,
        },
      }),
    onSuccess: (t) => {
      toast.success("Ticket created", { description: t.id });
      setNewOpen(false);
      setFormTitle("");
      setFormAssetId("");
      setFormPriority("Medium");
      setFormRequester("");
      setFormAssignee("");
      setFormDescription("");
      setSelectedId(t.id);
      invalidateTickets();
    },
    onError: (e: Error) => toast.error(e.message ?? "Create failed"),
  });

  const statusMut = useMutation({
    mutationFn: (payload: { id: string; status: TicketStatus }) =>
      callAuthenticatedServerFn(updateTicketStatus, { data: payload }),
    onSuccess: (_data, variables) => {
      toast.success(`Ticket marked ${variables.status}`);
      invalidateTickets();
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });

  const changeStatus = (id: string, status: TicketStatus) => {
    statusMut.mutate({ id, status });
  };

  const updateDetailsMut = useMutation({
    mutationFn: () =>
      callAuthenticatedServerFn(updateTicket, {
        data: {
          id: detail!.id,
          title: editTitle.trim(),
          priority: editPriority,
          assigneeName: editAssignee.trim() || null,
          requesterName: editRequester.trim() || null,
          assetId: editAssetId.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Ticket details saved");
      invalidateTickets();
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });

  const commentMut = useMutation({
    mutationFn: () =>
      callAuthenticatedServerFn(addTicketComment, {
        data: {
          id: effectiveSelected!,
          author: commentAuthor.trim(),
          body: commentBody.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Comment added");
      setCommentBody("");
      invalidateTickets();
    },
    onError: (e: Error) => toast.error(e.message ?? "Comment failed"),
  });

  const openCount = useMemo(() => items.filter((t) => t.status !== "Closed").length, [items]);
  const slaRisk = useMemo(() => {
    const now = Date.now();
    return items.filter(
      (t) => !isTerminal(t.status) && t.slaDueAt && new Date(t.slaDueAt).getTime() < now,
    ).length;
  }, [items]);

  const subtitle = listLoading
    ? "Loading queue…"
    : `${openCount} open (excl. closed) · ${slaRisk} SLA breach${slaRisk === 1 ? "" : "es"}`;

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Tickets"
        subtitle={subtitle}
        action={
          <Button size="sm" className="shadow-soft" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        }
      />

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New ticket</DialogTitle>
            <DialogDescription>
              Creates a tracked incident linked to your inventory when an asset is selected.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="t-title">Title</Label>
              <Input
                id="t-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Short summary"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Asset (optional)</Label>
              <Select
                value={formAssetId || "__none__"}
                onValueChange={(v) => setFormAssetId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {assetOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.id} — {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <Select
                value={formPriority}
                onValueChange={(v) => setFormPriority(v as TicketPriority)}
              >
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
            <div className="grid gap-1.5">
              <Label htmlFor="t-req">Requester</Label>
              <Input
                id="t-req"
                value={formRequester}
                onChange={(e) => setFormRequester(e.target.value)}
                placeholder="Name or team"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-asg">Assignee (optional)</Label>
              <Input
                id="t-asg"
                value={formAssignee}
                onChange={(e) => setFormAssignee(e.target.value)}
                placeholder="Technician name"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-desc">Description</Label>
              <Textarea
                id="t-desc"
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Initial notes (becomes first thread message)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={createMut.isPending || !formTitle.trim() || !formRequester.trim()}
              className="gap-2"
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {listLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading tickets…
        </div>
      ) : (
        <Card className="overflow-hidden border border-border/60 shadow-sm rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border/60">
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {[
                  "Ticket",
                  "Title",
                  "Asset",
                  "Priority",
                  "Status",
                  "Technician",
                  "SLA",
                  "Updated",
                ].map((h) => (
                  <th key={h} className="text-left font-semibold px-4 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`border-t border-border hover:bg-muted/40 transition duration-150 cursor-pointer relative ${effectiveSelected === t.id ? "bg-primary/[0.02]" : ""}`}
                >
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-primary">
                    <div className="flex items-center gap-2">
                      {/* Priority left line in table too! */}
                      <span className={`w-1.5 h-4 rounded-full ${
                        t.priority === "Critical" ? "bg-rose-500" :
                        t.priority === "High" ? "bg-amber-500" :
                        t.priority === "Medium" ? "bg-blue-500" : "bg-zinc-400"
                      }`} />
                      {t.id}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground">{t.title}</td>
                  <td className="px-4 py-3.5">
                    {t.assetId ? (
                      <span className="font-mono text-xs text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded">
                        {t.assetId}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill tone={priorityTone(t.priority)}>{t.priority}</StatusPill>
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    {canEditTickets ? (
                      <TicketStatusSelect
                        ticketId={t.id}
                        value={t.status}
                        compact
                        disabled={statusMut.isPending}
                        onChange={changeStatus}
                      />
                    ) : (
                      <StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-foreground/80">{t.assigneeName ?? "—"}</td>
                  <td className="px-4 py-3.5 text-muted-foreground font-medium text-xs">{slaLabel(t)}</td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modern Slide-over Sheet Sidebar for Ticket Details */}
      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="sm:max-w-[650px] w-full p-0 flex flex-col h-full bg-background/95 backdrop-blur-md border-l border-border/80 shadow-2xl">
          {detailLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm font-medium">Loading ticket details...</span>
            </div>
          ) : detail == null ? (
            <div className="flex items-center justify-center h-full p-6 text-muted-foreground">
              Ticket not found or has been removed.
            </div>
          ) : (
            <>
              {/* Custom Fixed Header */}
              <div className="p-6 border-b border-border/60 bg-muted/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                    {detail.id}
                  </span>
                  <div className="flex gap-2">
                    <StatusPill tone={priorityTone(detail.priority)}>{detail.priority}</StatusPill>
                    <StatusPill tone={statusTone(detail.status)}>{detail.status}</StatusPill>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-foreground leading-tight tracking-tight">
                  {detail.title}
                </h3>

                {/* Quick workflow status selection panel */}
                <div className="space-y-3 bg-background border border-border/50 rounded-xl p-3 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1 min-w-0">
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        Workflow Status
                      </Label>
                      <TicketStatusSelect
                        ticketId={detail.id}
                        value={detail.status}
                        disabled={statusMut.isPending || !canEditTickets}
                        onChange={changeStatus}
                      />
                    </div>
                    {canEditTickets ? (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={statusMut.isPending || detail.status === "Resolved"}
                          onClick={() => changeStatus(detail.id, "Resolved")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark resolved
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          disabled={statusMut.isPending || detail.status === "Closed"}
                          onClick={() => changeStatus(detail.id, "Closed")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Close ticket
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {detailLocked
                      ? "Ticket is closed — change status above to reopen (e.g. Open or In Progress)."
                      : "Pick a status or use Resolve / Close to update the ticket."}
                  </p>
                </div>
              </div>

              {/* Scrollable Content Area with Radix Tabs */}
              <Tabs defaultValue="comments" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 border-b border-border/40 bg-muted/10 shrink-0">
                  <TabsList className="w-full justify-start gap-6 bg-transparent h-12 p-0 border-b-0">
                    <TabsTrigger
                      value="comments"
                      className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 font-semibold text-sm transition-all"
                    >
                      Comments & Thread ({detail.messages.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="details"
                      className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 font-semibold text-sm transition-all"
                    >
                      Edit & Meta Details
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-background/50">
                  {/* Tab Content: Comments */}
                  <TabsContent value="comments" className="mt-0 h-full flex flex-col gap-6 outline-none">
                    <div className="flex-1 space-y-4 pr-1">
                      {detail.messages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                          No comments yet. Start the conversation below.
                        </div>
                      ) : (
                        detail.messages.map((m) => (
                          <div key={m.id} className="flex gap-3 items-start">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                              {initials(m.author)}
                            </div>
                            <div className="flex-1 bg-muted/40 hover:bg-muted/50 border border-border/40 rounded-2xl p-4 transition duration-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">{m.author}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm mt-1.5 text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {m.body}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Field */}
                    <div className="mt-auto border border-border/60 rounded-2xl p-4 bg-muted/10 backdrop-blur-sm shadow-sm space-y-3">
                      <div className="grid gap-2 grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="c-auth" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Your Name
                          </Label>
                          <Input
                            id="c-auth"
                            value={commentAuthor}
                            onChange={(e) => setCommentAuthor(e.target.value)}
                            placeholder="e.g. Sarah Ali"
                            className="h-8 text-xs bg-background/50"
                            disabled={detailLocked || !canEditTickets}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="c-body" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Comment Body
                        </Label>
                        <Textarea
                          id="c-body"
                          placeholder="Write a comment or resolution note..."
                          className="w-full text-sm bg-background/50 min-h-[80px] rounded-xl"
                          rows={3}
                          value={commentBody}
                          onChange={(e) => setCommentBody(e.target.value)}
                          disabled={detailLocked || !canEditTickets}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground/75" />
                          {detailLocked ? "Comments locked" : "Attachments coming soon"}
                        </span>
                        
                        <Button
                          type="button"
                          size="sm"
                          className="gap-2 px-4 shadow-sm"
                          disabled={
                            commentMut.isPending ||
                            !commentAuthor.trim() ||
                            !commentBody.trim() ||
                            detailLocked ||
                            !canEditTickets
                          }
                          onClick={() => commentMut.mutate()}
                        >
                          {commentMut.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MessageSquare className="h-3.5 w-3.5" />
                          )}
                          Comment
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab Content: Details & Actions */}
                  <TabsContent value="details" className="mt-0 outline-none">
                    {!detailLocked && canEditTickets ? (
                      <div className="space-y-5">
                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                            IT Management & Meta Fields
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Edit details to link inventory items, adjust priorities, or reassign the incident.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="ed-title" className="text-xs font-semibold">
                              Title Summary
                            </Label>
                            <Input
                              id="ed-title"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Ticket title"
                              className="bg-background/50 h-10"
                            />
                          </div>

                          <div className="grid gap-4 grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Priority</Label>
                              <Select
                                value={editPriority}
                                onValueChange={(v) => setEditPriority(v as TicketPriority)}
                              >
                                <SelectTrigger id="ed-priority" className="bg-background/50 h-10">
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

                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Linked Asset</Label>
                              <Select
                                value={editAssetId || "__none__"}
                                onValueChange={(v) => setEditAssetId(v === "__none__" ? "" : v)}
                              >
                                <SelectTrigger id="ed-asset" className="bg-background/50 h-10">
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">None</SelectItem>
                                  {assetOptions.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                      {a.id} — {a.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {detail.deskNumber ? (
                            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                              <span className="text-muted-foreground text-xs">Desk number · </span>
                              <span className="font-medium">{detail.deskNumber}</span>
                            </div>
                          ) : null}

                          <div className="grid gap-4 grid-cols-2">
                            <div className="space-y-1.5">
                              <Label htmlFor="ed-req" className="text-xs font-semibold">
                                Requester Name
                              </Label>
                              <Input
                                id="ed-req"
                                value={editRequester}
                                onChange={(e) => setEditRequester(e.target.value)}
                                placeholder="Name or team"
                                className="bg-background/50 h-10"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="ed-asg" className="text-xs font-semibold">
                                Assignee Technician
                              </Label>
                              <Input
                                id="ed-asg"
                                value={editAssignee}
                                onChange={(e) => setEditAssignee(e.target.value)}
                                placeholder="Technician name"
                                className="bg-background/50 h-10"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-border/60">
                          <Button
                            type="button"
                            disabled={updateDetailsMut.isPending || !editTitle.trim() || !detailsDirty}
                            className="gap-2 shadow-sm px-5"
                            onClick={() => updateDetailsMut.mutate()}
                          >
                            {updateDetailsMut.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving Changes
                              </>
                            ) : (
                              "Save Details"
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-3">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Clock className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {detailLocked ? "Ticket Details Locked" : "Read-Only Access"}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                          {detailLocked 
                            ? "This ticket has been closed. Reopen or adjust status to enable editing."
                            : "You do not have administrative write permissions to edit metadata fields."
                          }
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
