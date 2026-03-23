/**
 * CLAUDE.md-lignende konfigurasjon — domeneregler per prosess (#27).
 *
 * Regler lagres som Markdown i Firestore og inkluderes i LLM system-prompt.
 */

import { getDocument, updateDocument } from "@/lib/firebase/firestore";

export type RuleScope = "global" | "org" | "process";

export type ProcessRules = {
  scope: RuleScope;
  content: string;         // Markdown
  lastUpdatedBy: string;
  lastUpdatedAt: Date;
};

/** Hent regler for en prosess (med arv: global → org → prosess) */
export async function getEffectiveRules(
  orgId: string,
  processId: string
): Promise<string> {
  const parts: string[] = [];

  // Global regler
  const global = await getDocument<ProcessRules>("processRules", "global");
  if (global?.content) parts.push(`## Globale regler\n${global.content}`);

  // Org-regler
  const org = await getDocument<ProcessRules>("processRules", `org_${orgId}`);
  if (org?.content) parts.push(`## Organisasjonsregler\n${org.content}`);

  // Prosess-regler (mest spesifikk vinner)
  const process = await getDocument<ProcessRules>(
    "processRules",
    `process_${processId}`
  );
  if (process?.content) parts.push(`## Prosessregler\n${process.content}`);

  return parts.join("\n\n");
}

/** Lagre regler */
export async function saveRules(
  id: string,
  scope: RuleScope,
  content: string,
  updatedBy: string
) {
  return updateDocument("processRules", id, {
    scope,
    content,
    lastUpdatedBy: updatedBy,
    lastUpdatedAt: new Date(),
  });
}

/** Bygg LLM-prompt-seksjon fra regler */
export function rulesToPromptSection(rules: string): string {
  if (!rules.trim()) return "";
  return [
    "\n--- DOMENEREGLER (MÅ FØLGES) ---",
    rules,
    "--- SLUTT DOMENEREGLER ---\n",
  ].join("\n");
}
