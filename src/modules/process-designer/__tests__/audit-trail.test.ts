import { describe, it, expect } from "vitest";
import { exportAuditToCSV } from "../lib/audit-trail";
import type { AuditEntry } from "../lib/audit-trail";

describe("exportAuditToCSV", () => {
  const makeEntry = (overrides: Partial<AuditEntry> = {}): AuditEntry => ({
    processId: "p1",
    action: "agent_execute",
    actor: { type: "agent", uid: "a1", name: "Test Agent" },
    createdAt: new Date("2025-01-15T10:30:00Z"),
    ...overrides,
  });

  it("genererer CSV med headere", () => {
    const csv = exportAuditToCSV([]);
    expect(csv).toContain("Tidspunkt");
    expect(csv).toContain("Handling");
    expect(csv).toContain("Aktør");
  });

  it("inkluderer oppføringsdata i CSV", () => {
    const entries = [
      makeEntry({
        action: "human_approve",
        actor: { type: "user", uid: "u1", name: "Ola Nordmann" },
        stepId: "step-1",
        decision: "Godkjent",
        autonomyLevel: 3,
        durationMs: 1500,
      }),
    ];
    const csv = exportAuditToCSV(entries);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2); // header + 1 row
    expect(lines[1]).toContain("human_approve");
    expect(lines[1]).toContain("user:Ola Nordmann");
    expect(lines[1]).toContain("step-1");
    expect(lines[1]).toContain("Godkjent");
    expect(lines[1]).toContain("3");
    expect(lines[1]).toContain("1500");
  });

  it("håndterer tomme valgfrie felt", () => {
    const csv = exportAuditToCSV([makeEntry()]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    // stepId, decision, autonomyLevel, durationMs are all empty
    expect(lines[1]).toContain('""');
  });

  it("håndterer flere rader", () => {
    const entries = [makeEntry(), makeEntry({ action: "system_error" }), makeEntry({ action: "deploy" })];
    const csv = exportAuditToCSV(entries);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(4); // header + 3 rows
  });
});
