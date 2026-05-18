import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isFirebaseConfigured } from "@/lib/firebase/env";
import { firestoreSeedAssets } from "@/lib/firebase/assets.firestore";
import { firestoreSeedEmployees } from "@/lib/firebase/employees.firestore";
import { firestoreSeedMaintenanceJobs } from "@/lib/firebase/maintenance.firestore";
import { firestoreSeedTickets } from "@/lib/firebase/tickets.firestore";
import { firestoreSeedTransfers } from "@/lib/firebase/transfers.firestore";
import { firestoreSeedVendors } from "@/lib/firebase/vendors.firestore";
import { buildSeedAssets } from "./seed.assets";
import { buildSeedEmployees } from "./seed.employees";
import { buildSeedMaintenanceJobs } from "./seed.maintenance";
import { buildSeedTickets } from "./seed.tickets";
import { buildSeedTransfers } from "./seed.transfers";
import { buildSeedVendors } from "./seed.vendors";

export async function seedAllDemoDataToFirestore(): Promise<{
  written: number;
  message: string;
}> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Add VITE_FIREBASE_* to .env (see FIREBASE_SETUP.md).",
    );
  }
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH in .env.",
    );
  }

  const assets = buildSeedAssets();
  const { written: assetsWritten } = await firestoreSeedAssets(assets);
  const tickets = buildSeedTickets();
  const { written: ticketsWritten } = await firestoreSeedTickets(tickets);
  const transfers = buildSeedTransfers();
  const { written: transfersWritten } = await firestoreSeedTransfers(transfers);
  const maintenanceJobs = buildSeedMaintenanceJobs();
  const { written: maintenanceWritten } = await firestoreSeedMaintenanceJobs(maintenanceJobs);
  const employees = buildSeedEmployees();
  const { written: employeesWritten } = await firestoreSeedEmployees(employees);
  const vendors = buildSeedVendors();
  const { written: vendorsWritten } = await firestoreSeedVendors(vendors);
  const written =
    assetsWritten +
    ticketsWritten +
    transfersWritten +
    maintenanceWritten +
    employeesWritten +
    vendorsWritten;

  return {
    written,
    message:
      `Seeded ${assetsWritten} assets, ${ticketsWritten} tickets, ${transfersWritten} transfers, ` +
      `${maintenanceWritten} maintenance jobs, ${employeesWritten} employees, and ${vendorsWritten} vendors.`,
  };
}
