import type { Asset } from "@/lib/models";

/** Person name + optional PC code from the workforce assignment sheet (AIM_* → PC-*). */
export type EmployeeRosterRow = {
  name: string;
  pcNo: string | null;
};

/** Current desk assignments — regenerate via scripts/import_employee_roster.py when the sheet changes. */
export const EMPLOYEE_ROSTER: EmployeeRosterRow[] = [
  { name: "Mohammad Abdul Azam", pcNo: "AIM_A2" },
  { name: "Khajakhakeemoddin", pcNo: "AIM_S1" },
  { name: "Prasad Rao.D", pcNo: "AIM_C20" },
  { name: "Mohammed Nadeem", pcNo: null },
  { name: "Fahad Siddiq", pcNo: null },
  { name: "Mustafa Siddique", pcNo: null },
  { name: "Mohammad Mazharoddin", pcNo: "AIM_S" },
  { name: "Abdul Waheed", pcNo: null },
  { name: "Mohammed Arif Ali", pcNo: "AIM_C16" },
  { name: "Nawazuddin", pcNo: null },
  { name: "Rashid Hussain", pcNo: null },
  { name: "Mounisha Reddy", pcNo: null },
  { name: "Naseeullah shareef", pcNo: "AIM_C11" },
  { name: "Priyanka.G", pcNo: "AIM_C18" },
  { name: "Sneha.M", pcNo: "AIM_C26" },
  { name: "Srigna Reddy", pcNo: null },
  { name: "Md.Khaleel uddin Ali", pcNo: "AIM_B1" },
  { name: "B.Laxmi", pcNo: "AIM_C13" },
  { name: "Habeeb Ur rahman", pcNo: "AIM_A3" },
  { name: "CH Vaishnavi", pcNo: "AIM_C28" },
  { name: "Akanksha Kaluri", pcNo: "AIM_C29" },
  { name: "Rais Uddun", pcNo: null },
  { name: "Ali Akbar", pcNo: null },
  { name: "Sharan Kumar", pcNo: null },
  { name: "Varun.V", pcNo: null },
  { name: "Dhanunjay Goud", pcNo: null },
  { name: "Amrulla Shareef", pcNo: "AIM_C15" },
  { name: "Mallika Varadha", pcNo: "AIM_C14" },
  { name: "Naveed Ahmed", pcNo: null },
  { name: "Abuzar", pcNo: null },
  { name: "Kaif Sajjad", pcNo: null },
  { name: "Satyanarayana", pcNo: null },
  { name: "Basith Khaleel", pcNo: "AIM_C02" },
  { name: "Ashfaq Hussain", pcNo: null },
  { name: "Shaik Rauf", pcNo: null },
  { name: "Syed Abdul Baseer", pcNo: null },
  { name: "Madhavi Priyadarshini", pcNo: "AIM_C24" },
  { name: "Shaik baji baba(SOHAIL)", pcNo: "AIM_C01" },
  { name: "Bala Murali.R", pcNo: "AIM_C05" },
  { name: "Sathwik Neela", pcNo: null },
  { name: "Abdul Irfan", pcNo: null },
  { name: "Divya Yedla", pcNo: "AIM_S2" },
  { name: "Abdul Rehman", pcNo: null },
  { name: "Mohd Khadeer", pcNo: null },
  { name: "Abdul Kalam", pcNo: null },
  { name: "Abdul wadood", pcNo: "AIM_C19" },
  { name: "MD ASHFAQ", pcNo: null },
];

/** Map sheet PC code (AIM_A2) to inventory id (PC-A02). */
export function pcNoToAssetId(pcNo: string): string | null {
  const code = pcNo.trim().toUpperCase();
  if (!code.startsWith("AIM_")) return null;
  const suffix = code.slice(4);
  if (!suffix) return null;
  const match = /^([A-Z])(\d*)$/.exec(suffix);
  if (!match) return null;
  const letter = match[1];
  const digits = match[2];
  if (letter === "S") {
    if (!digits) return "PC-S";
    return `PC-S${digits.padStart(2, "0")}`;
  }
  if (!digits) return null;
  return `PC-${letter}${digits.padStart(2, "0")}`;
}

/** Extra desktops referenced in the roster but not in Assets Data 2025.xlsx. */
export function buildRosterExtraAssets(): Asset[] {
  const template = {
    category: "Desktop" as const,
    department: "IT" as const,
    status: "Active" as const,
    warrantyUntil: null,
    lastServiceAt: null,
    serial: null,
    location: null,
    purchaseDate: null,
    specifications: null,
    assignedTo: null,
  };
  return [
    { ...template, id: "PC-S", name: "S" },
    { ...template, id: "PC-S01", name: "S1" },
    { ...template, id: "PC-S02", name: "S2" },
  ];
}

export function applyEmployeeRosterToAssets(assets: Asset[]): Asset[] {
  const byId = new Map(assets.map((a) => [a.id, { ...a, assignedTo: null as string | null }]));
  for (const row of EMPLOYEE_ROSTER) {
    if (!row.pcNo) continue;
    const assetId = pcNoToAssetId(row.pcNo);
    if (!assetId) continue;
    const asset = byId.get(assetId);
    if (asset) asset.assignedTo = row.name;
  }
  return Array.from(byId.values());
}

export function rosterEmail(name: string, index: number): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || "employee";
  return `${slug}.${String(index).padStart(3, "0")}@eclicktechsolutions.com`;
}

export function countRosterAssetsForName(name: string): number {
  return EMPLOYEE_ROSTER.filter((r) => r.name === name && r.pcNo).length;
}
