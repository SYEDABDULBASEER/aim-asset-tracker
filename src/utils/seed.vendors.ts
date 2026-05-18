import type { Vendor } from "@/lib/models";

export function buildSeedVendors(): Vendor[] {
  return [
    {
      id: "VND-001",
      name: "TechCare Services",
      category: "Laptops & PCs",
      contactEmail: "ops@techcare.io",
      contracts: 3,
      slaPercent: 98,
      responseHours: 4,
    },
    {
      id: "VND-002",
      name: "PrintWorks Co.",
      category: "Printers & Toner",
      contactEmail: "support@printworks.co",
      contracts: 2,
      slaPercent: 92,
      responseHours: 8,
    },
    {
      id: "VND-003",
      name: "NetSecure Ltd.",
      category: "Network & Security",
      contactEmail: "noc@netsecure.com",
      contracts: 4,
      slaPercent: 88,
      responseHours: 6,
    },
    {
      id: "VND-004",
      name: "Cloud9 Hardware",
      category: "Servers & Storage",
      contactEmail: "sales@cloud9hw.com",
      contracts: 1,
      slaPercent: 81,
      responseHours: 12,
    },
  ];
}
