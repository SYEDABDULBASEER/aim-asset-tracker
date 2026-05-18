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
import { LayoutGrid, List, Plus, Clock, Paperclip, MessageSquare, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/models";
import { canWrite } from "@/lib/auth/roles";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { useAuth } from "@/lib/auth/AuthProvider";
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

function Tickets() {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const canEditTickets = canWrite(role, "tickets");
  const [view, setView] = useState<"kanban" | "table">("kanban");
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

  const effectiveSelected = selectedId ?? items[0]?.id ?? null;

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
    onSuccess: () => {
      toast.success("Status updated");
      invalidateTickets();
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });

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
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={`h-8 px-3 rounded-md text-sm inline-flex items-center gap-1.5 ${view === "kanban" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                className={`h-8 px-3 rounded-md text-sm inline-flex items-center gap-1.5 ${view === "table" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
              >
                <List className="h-4 w-4" />
                Table
              </button>
            </div>
            <Button size="sm" className="shadow-soft" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </div>
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
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {COLS.map((col) => {
            const list = items.filter((t) => t.status === col);
            return (
              <div key={col} className="bg-muted/40 rounded-xl p-3 min-h-[400px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <StatusPill tone={statusTone(col)}>{col}</StatusPill>
                    <span className="text-xs text-muted-foreground">{list.length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {list.map((t) => (
                    <Card
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(t.id);
                        }
                      }}
                      onClick={() => setSelectedId(t.id)}
                      className={`p-3 hover:shadow-elevated transition cursor-pointer ${effectiveSelected === t.id ? "ring-2 ring-primary/40" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-muted-foreground">{t.id}</span>
                        <StatusPill tone={priorityTone(t.priority)}>{t.priority}</StatusPill>
                      </div>
                      <div className="text-sm font-medium leading-snug">{t.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {t.assetId ?? "—"}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {slaLabel(t)}
                        </div>
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-chart-5 text-white text-[10px] font-semibold flex items-center justify-center">
                          {initials(t.assigneeName ?? t.requesterName ?? "?")}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
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
                  <th key={h} className="text-left font-medium px-4 py-3">
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
                  className={`border-t border-border hover:bg-muted/30 cursor-pointer ${effectiveSelected === t.id ? "bg-muted/50" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.assetId ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={priorityTone(t.priority)}>{t.priority}</StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill>
                  </td>
                  <td className="px-4 py-3">{t.assigneeName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{slaLabel(t)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card className="mt-6 p-6">
        {!effectiveSelected ? (
          <p className="text-sm text-muted-foreground">No tickets in queue.</p>
        ) : detailLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading conversation…
          </div>
        ) : detail == null ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Ticket not found or was removed.
          </p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <span className="text-[11px] font-mono text-muted-foreground">{detail.id}</span>
                <h3 className="text-lg font-semibold mt-0.5">{detail.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <StatusPill tone={priorityTone(detail.priority)}>{detail.priority}</StatusPill>
                  <StatusPill tone={statusTone(detail.status)}>{detail.status}</StatusPill>
                  <span className="text-xs text-muted-foreground self-center">
                    {detail.assetId ? (
                      <>
                        Linked to{" "}
                        <Link
                          to="/admin/assets/$id"
                          params={{ id: detail.assetId }}
                          search={{ q: undefined }}
                          className="text-primary font-medium hover:underline"
                        >
                          {detail.assetId}
                        </Link>
                      </>
                    ) : (
                      "No asset linked"
                    )}
                    {detail.requesterName ? ` · ${detail.requesterName}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[200px]">
                <Label className="text-xs text-muted-foreground">Workflow status</Label>
                <Select
                  value={detail.status}
                  disabled={statusMut.isPending || detailLocked || !canEditTickets}
                  onValueChange={(v) =>
                    statusMut.mutate({ id: detail.id, status: v as TicketStatus })
                  }
                >
                  <SelectTrigger>
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
                {detail.status === "Resolved" && !detailLocked && canEditTickets ? (
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Resolved — adjust details below, then set status to <strong>Closed</strong> to
                    archive.
                  </p>
                ) : null}
                {detailLocked ? (
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Closed tickets are read-only.
                  </p>
                ) : null}
              </div>
            </div>

            {!detailLocked && canEditTickets ? (
              <div className="mb-6 rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                <div className="text-xs font-semibold text-foreground">Edit ticket (IT)</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="ed-title" className="text-xs">
                      Title
                    </Label>
                    <Input
                      id="ed-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Ticket title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Priority</Label>
                    <Select
                      value={editPriority}
                      onValueChange={(v) => setEditPriority(v as TicketPriority)}
                    >
                      <SelectTrigger id="ed-priority">
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
                    <Label className="text-xs">Asset</Label>
                    <Select
                      value={editAssetId || "__none__"}
                      onValueChange={(v) => setEditAssetId(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger id="ed-asset">
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
                  <div className="space-y-1.5">
                    <Label htmlFor="ed-req" className="text-xs">
                      Requester
                    </Label>
                    <Input
                      id="ed-req"
                      value={editRequester}
                      onChange={(e) => setEditRequester(e.target.value)}
                      placeholder="Name or team"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ed-asg" className="text-xs">
                      Assignee
                    </Label>
                    <Input
                      id="ed-asg"
                      value={editAssignee}
                      onChange={(e) => setEditAssignee(e.target.value)}
                      placeholder="Technician (optional)"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={updateDetailsMut.isPending || !editTitle.trim() || !detailsDirty}
                    onClick={() => updateDetailsMut.mutate()}
                  >
                    {updateDetailsMut.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Saving…
                      </>
                    ) : (
                      "Save details"
                    )}
                  </Button>
                </div>
              </div>
            ) : !detailLocked && !canEditTickets ? (
              <p className="text-xs text-muted-foreground mb-4">
                You have read-only access to tickets.
              </p>
            ) : null}

            <div className="space-y-4">
              {detail.messages.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted text-[11px] font-semibold flex items-center justify-center shrink-0">
                    {initials(m.author)}
                  </div>
                  <div className="flex-1 bg-muted/40 rounded-lg p-3">
                    <div className="text-xs font-medium">
                      {m.author}{" "}
                      <span className="text-muted-foreground font-normal">
                        · {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{m.body}</p>
                  </div>
                </div>
              ))}
              <div className="border border-border rounded-lg p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="c-auth" className="text-xs">
                      Your name
                    </Label>
                    <Input
                      id="c-auth"
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      placeholder="e.g. Sarah Ali"
                      className="mt-1"
                      disabled={detailLocked || !canEditTickets}
                    />
                  </div>
                </div>
                <Textarea
                  placeholder="Write a comment…"
                  className="w-full text-sm bg-transparent mt-2 min-h-[72px]"
                  rows={2}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  disabled={detailLocked || !canEditTickets}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Paperclip className="h-3.5 w-3.5" />
                    {detailLocked
                      ? "Comments are closed for archived tickets."
                      : "Attachments coming soon"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5"
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
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
