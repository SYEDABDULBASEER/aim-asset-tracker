import type { Employee } from "@/lib/models";

export function buildSeedEmployees(): Employee[] {
  return [
    {
      id: "EMP-001",
      name: "Ahmed Khan",
      role: "IT Manager",
      department: "IT",
      email: "ahmed@eclicktech.com",
      assetCount: 4,
    },
    {
      id: "EMP-002",
      name: "Sarah Ali",
      role: "Senior Designer",
      department: "Design",
      email: "sarah@eclicktech.com",
      assetCount: 3,
    },
    {
      id: "EMP-003",
      name: "Mohammed Faisal",
      role: "Sales Lead",
      department: "Sales",
      email: "faisal@eclicktech.com",
      assetCount: 2,
    },
    {
      id: "EMP-004",
      name: "Priya Sharma",
      role: "Marketing Manager",
      department: "Marketing",
      email: "priya@eclicktech.com",
      assetCount: 3,
    },
    {
      id: "EMP-005",
      name: "David Mathew",
      role: "Operations Head",
      department: "Operations",
      email: "david@eclicktech.com",
      assetCount: 2,
    },
  ];
}
