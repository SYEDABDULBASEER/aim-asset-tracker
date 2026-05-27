import { describe, expect, it } from "vitest";
import {
  assetStatusTone,
  maintenanceStatusTone,
  ticketPriorityTone,
  ticketStatusTone,
  transferStatusTone,
  vendorSlaTone,
} from "@/lib/ui/status-tones";

describe("status-tones", () => {
  it("maps ticket priorities", () => {
    expect(ticketPriorityTone("Critical")).toBe("danger");
    expect(ticketPriorityTone("High")).toBe("warning");
    expect(ticketPriorityTone("Low")).toBe("muted");
  });

  it("maps ticket statuses", () => {
    expect(ticketStatusTone("Resolved")).toBe("success");
    expect(ticketStatusTone("Waiting Parts")).toBe("warning");
    expect(ticketStatusTone("Closed")).toBe("muted");
  });

  it("maps transfer statuses", () => {
    expect(transferStatusTone("Approved")).toBe("success");
    expect(transferStatusTone("Rejected")).toBe("danger");
  });

  it("maps maintenance statuses", () => {
    expect(maintenanceStatusTone("Completed")).toBe("success");
    expect(maintenanceStatusTone("Cancelled")).toBe("danger");
  });

  it("maps asset statuses", () => {
    expect(assetStatusTone("Active")).toBe("success");
    expect(assetStatusTone("Lost")).toBe("danger");
  });

  it("maps vendor SLA percent", () => {
    expect(vendorSlaTone(96)).toBe("success");
    expect(vendorSlaTone(80)).toBe("warning");
  });
});
