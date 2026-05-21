import type { Employee } from "@/lib/models";
import { EMPLOYEE_ROSTER, countRosterAssetsForName, rosterEmail } from "./seed.employee-roster";

export function buildSeedEmployees(): Employee[] {
  return EMPLOYEE_ROSTER.map((row, index) => ({
    id: `EMP-${String(index + 1).padStart(3, "0")}`,
    name: row.name,
    role: "Staff",
    department: "Operations",
    email: rosterEmail(row.name, index + 1),
    assetCount: countRosterAssetsForName(row.name),
  }));
}
