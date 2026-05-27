import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/ui-kit/Card";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { ListPageSkeleton } from "@/components/ui-kit/ListPageSkeleton";
import { PageShell } from "@/components/ui-kit/PageShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth, useAuthQueryEnabled } from "@/lib/auth/AuthProvider";
import type { Employee } from "@/lib/models";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { AuthStatusBanner } from "@/components/auth/AuthStatusBanner";
import { ReadOnlyRoleBanner } from "@/components/auth/ReadOnlyRoleBanner";
import { formatListQueryError } from "@/lib/auth/list-query-error";
import { destructiveAlertActionClass, destructiveIconButtonClass } from "@/lib/ui/button-hierarchy";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from "@/utils/employees.functions";

export const Route = createFileRoute("/admin/employees")({
  head: () => ({ meta: [{ title: "Employees — AssetSphere" }] }),
  component: Employees,
});

type EmployeeFormValues = {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
};

function emptyEmployeeForm(): EmployeeFormValues {
  return { id: "", name: "", role: "", department: "", email: "" };
}

function employeeToForm(employee: Employee): EmployeeFormValues {
  return {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    department: employee.department,
    email: employee.email,
  };
}

function Employees() {
  const auth = useAuth();
  const authReady = useAuthQueryEnabled();
  const queryClient = useQueryClient();
  const isAdmin = auth.role === "admin";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<EmployeeFormValues>(emptyEmployeeForm);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["employees"],
    queryFn: () => callAuthenticatedServerFn(listEmployees, { data: { limit: 200, offset: 0 } }),
    enabled: authReady,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        id: formValues.id.trim(),
        name: formValues.name.trim(),
        role: formValues.role.trim(),
        department: formValues.department.trim(),
        email: formValues.email.trim(),
      };
      if (!payload.id || !payload.name || !payload.email) {
        throw new Error("ID, name, and email are required.");
      }
      return editingId
        ? callAuthenticatedServerFn(updateEmployee, { data: payload })
        : callAuthenticatedServerFn(createEmployee, { data: payload });
    },
    onSuccess: () => {
      toast.success(editingId ? "Employee updated" : "Employee created");
      setDialogOpen(false);
      setEditingId(null);
      setFormValues(emptyEmployeeForm());
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message ?? "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => callAuthenticatedServerFn(deleteEmployee, { data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error("Employee not found");
        return;
      }
      toast.success("Employee deleted");
      setDeleteTargetId(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message ?? "Delete failed"),
  });

  const employees = data?.items ?? [];
  const departments = new Set(employees.map((employee) => employee.department)).size;

  return (
    <PageShell variant="wide">
      <PageHeader
        title="Employees"
        subtitle={
          isLoading
            ? "Loading directory…"
            : `${data?.total ?? employees.length} employees · ${departments} departments`
        }
        action={
          <Button
            type="button"
            className="h-9 shadow-soft"
            disabled={!isAdmin}
            title={isAdmin ? undefined : "Only administrators can add employees"}
            onClick={() => {
              setEditingId(null);
              setFormValues(emptyEmployeeForm());
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add employee
          </Button>
        }
      />
      <ReadOnlyRoleBanner role={auth.role} scope="employee directory" />
      {isError ? (
        <AuthStatusBanner
          error={formatListQueryError(error)}
          onRetry={() => void refetch()}
          onSignOut={auth.user ? () => void auth.signOut() : undefined}
          className="mb-4 rounded-lg border border-border"
        />
      ) : null}
      {isLoading ? (
        <ListPageSkeleton rows={6} columns={3} />
      ) : !isError && employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees yet"
          description="Add directory records so assets can be assigned to people and departments."
          action={
            isAdmin ? (
              <Button
                type="button"
                className="h-9 shadow-soft"
                onClick={() => {
                  setEditingId(null);
                  setFormValues(emptyEmployeeForm());
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add employee
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <Card key={employee.id} className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-chart-5 text-white text-sm font-semibold flex items-center justify-center">
                {employee.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{employee.name}</div>
                <div className="text-xs text-muted-foreground">
                  {employee.role} · {employee.department}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {employee.email}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold">{employee.assetCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  assets
                </div>
                {isAdmin ? (
                  <div className="mt-2 flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingId(employee.id);
                        setFormValues(employeeToForm(employee));
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={`h-7 w-7 ${destructiveIconButtonClass}`}
                      aria-label={`Delete employee ${employee.name}`}
                      onClick={() => setDeleteTargetId(employee.id)}
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargetId
                ? `Remove ${deleteTargetId} from the directory. Assigned assets are not deleted.`
                : "Remove this employee from the directory."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={destructiveAlertActionClass}
              onClick={() => {
                if (deleteTargetId) deleteMut.mutate(deleteTargetId);
              }}
              disabled={deleteMut.isPending || !deleteTargetId}
            >
              Delete employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit employee" : "Add employee"}</DialogTitle>
            <DialogDescription>Manage directory records for asset assignment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="employee-id">Employee ID</Label>
              <Input
                id="employee-id"
                value={formValues.id}
                readOnly={Boolean(editingId)}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, id: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="employee-name">Name</Label>
              <Input
                id="employee-name"
                value={formValues.name}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="employee-role">Role</Label>
              <Input
                id="employee-role"
                value={formValues.role}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, role: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="employee-department">Department</Label>
              <Input
                id="employee-department"
                value={formValues.department}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, department: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="employee-email">Email</Label>
              <Input
                id="employee-email"
                type="email"
                value={formValues.email}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {editingId ? "Save changes" : "Create employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
