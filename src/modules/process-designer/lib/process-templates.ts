/**
 * Prosessmaler — forhåndsbygde templates for vanlige prosesser (#21).
 */

import type { ProcessNode, ProcessEdge } from "../types";

export type ProcessTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  nodes: ProcessNode[];
  edges: ProcessEdge[];
};

export const PROCESS_TEMPLATES: ProcessTemplate[] = [
  {
    id: "invoice-receipt",
    name: "Fakturamottak og -kontering",
    description: "Automatisk mottak, OCR-skanning, kontering og godkjenning av inngående fakturaer",
    category: "Regnskap",
    tags: ["faktura", "kontering", "OCR"],
    nodes: [
      { id: "start", type: "startEvent", label: "Faktura mottatt", position: { x: 0, y: 100 }, metadata: {} },
      { id: "ocr", type: "serviceTask", label: "OCR-skanning", position: { x: 200, y: 100 }, metadata: {},
        agentConfig: { autonomyLevel: 5, llmPrompt: "Ekstraher data fra fakturabilde", tools: ["ocr"], maxIterations: 3, timeout: 30000, humanApprovalRequired: false } },
      { id: "check", type: "exclusiveGateway", label: "Beløp > 100k?", position: { x: 400, y: 100 }, metadata: {} },
      { id: "approve", type: "userTask", label: "Manuell godkjenning", position: { x: 600, y: 0 }, metadata: {} },
      { id: "book", type: "serviceTask", label: "Kontér faktura", position: { x: 600, y: 200 }, metadata: {},
        agentConfig: { autonomyLevel: 3, llmPrompt: "Kontér basert på leverandør og kategori", tools: ["tripletex"], maxIterations: 5, timeout: 60000, humanApprovalRequired: false } },
      { id: "end", type: "endEvent", label: "Ferdig", position: { x: 800, y: 100 }, metadata: {} },
    ],
    edges: [
      { id: "e1", source: "start", target: "ocr" },
      { id: "e2", source: "ocr", target: "check" },
      { id: "e3", source: "check", target: "approve", condition: "amount > 100000", label: "Ja" },
      { id: "e4", source: "check", target: "book", condition: "amount <= 100000", label: "Nei" },
      { id: "e5", source: "approve", target: "book" },
      { id: "e6", source: "book", target: "end" },
    ],
  },
  {
    id: "bank-reconciliation",
    name: "Bankavstemmingsprosess",
    description: "Automatisk avstemming av banktransaksjoner mot bokførte poster",
    category: "Regnskap",
    tags: ["bank", "avstemming"],
    nodes: [
      { id: "start", type: "timerEvent", label: "Daglig kl 06:00", position: { x: 0, y: 100 }, metadata: {} },
      { id: "fetch", type: "serviceTask", label: "Hent transaksjoner", position: { x: 200, y: 100 }, metadata: {},
        agentConfig: { autonomyLevel: 4, llmPrompt: "Hent nye banktransaksjoner", tools: ["bank-api"], maxIterations: 3, timeout: 30000, humanApprovalRequired: false } },
      { id: "match", type: "serviceTask", label: "Automatisk matching", position: { x: 400, y: 100 }, metadata: {},
        agentConfig: { autonomyLevel: 3, llmPrompt: "Match transaksjoner mot bokførte poster", tools: ["tripletex"], maxIterations: 10, timeout: 120000, humanApprovalRequired: false } },
      { id: "review", type: "userTask", label: "Gjennomgå avvik", position: { x: 600, y: 100 }, metadata: {} },
      { id: "end", type: "endEvent", label: "Avstemt", position: { x: 800, y: 100 }, metadata: {} },
    ],
    edges: [
      { id: "e1", source: "start", target: "fetch" },
      { id: "e2", source: "fetch", target: "match" },
      { id: "e3", source: "match", target: "review" },
      { id: "e4", source: "review", target: "end" },
    ],
  },
  {
    id: "vat-settlement",
    name: "MVA-oppgjør og -rapportering",
    description: "Beregning, validering og innsending av MVA-oppgjør",
    category: "Regnskap",
    tags: ["mva", "skatt", "altinn"],
    nodes: [
      { id: "start", type: "timerEvent", label: "Termin slutt", position: { x: 0, y: 100 }, metadata: {} },
      { id: "calculate", type: "serviceTask", label: "Beregn MVA", position: { x: 200, y: 100 }, metadata: {},
        agentConfig: { autonomyLevel: 3, llmPrompt: "Beregn MVA for perioden", tools: ["tripletex"], maxIterations: 5, timeout: 60000, humanApprovalRequired: false } },
      { id: "validate", type: "serviceTask", label: "Valider oppgjør", position: { x: 400, y: 100 }, metadata: {} },
      { id: "approve", type: "userTask", label: "Godkjenn oppgjør", position: { x: 600, y: 100 }, metadata: {} },
      { id: "submit", type: "serviceTask", label: "Send til Altinn", position: { x: 800, y: 100 }, metadata: {},
        agentConfig: { autonomyLevel: 2, llmPrompt: "Send MVA-oppgjør til Altinn", tools: ["altinn"], maxIterations: 3, timeout: 30000, humanApprovalRequired: true } },
      { id: "end", type: "endEvent", label: "Innsendt", position: { x: 1000, y: 100 }, metadata: {} },
    ],
    edges: [
      { id: "e1", source: "start", target: "calculate" },
      { id: "e2", source: "calculate", target: "validate" },
      { id: "e3", source: "validate", target: "approve" },
      { id: "e4", source: "approve", target: "submit" },
      { id: "e5", source: "submit", target: "end" },
    ],
  },
  {
    id: "payroll",
    name: "Lønnskjøring",
    description: "Beregning, godkjenning og utbetaling av lønn",
    category: "Regnskap",
    tags: ["lønn", "utbetaling"],
    nodes: [
      { id: "start", type: "timerEvent", label: "Lønnsdag -3", position: { x: 0, y: 100 }, metadata: {} },
      { id: "calculate", type: "serviceTask", label: "Beregn lønn", position: { x: 200, y: 100 }, metadata: {} },
      { id: "approve", type: "userTask", label: "Godkjenn lønnsgrunnlag", position: { x: 400, y: 100 }, metadata: {} },
      { id: "pay", type: "serviceTask", label: "Utbetal", position: { x: 600, y: 100 }, metadata: {},
        agentConfig: { autonomyLevel: 2, llmPrompt: "Utbetal godkjent lønn", tools: ["bank-api"], maxIterations: 3, timeout: 30000, humanApprovalRequired: true } },
      { id: "end", type: "endEvent", label: "Utbetalt", position: { x: 800, y: 100 }, metadata: {} },
    ],
    edges: [
      { id: "e1", source: "start", target: "calculate" },
      { id: "e2", source: "calculate", target: "approve" },
      { id: "e3", source: "approve", target: "pay" },
      { id: "e4", source: "pay", target: "end" },
    ],
  },
  {
    id: "month-close",
    name: "Månedsavslutning",
    description: "Automatisert månedsavslutning med avstemming og rapportering",
    category: "Regnskap",
    tags: ["avslutning", "rapport"],
    nodes: [
      { id: "start", type: "timerEvent", label: "Siste virkedag", position: { x: 0, y: 100 }, metadata: {} },
      { id: "reconcile", type: "serviceTask", label: "Bankavstemminger", position: { x: 200, y: 100 }, metadata: {} },
      { id: "fork", type: "parallelGateway", label: "Parallelle oppgaver", position: { x: 400, y: 100 }, metadata: {} },
      { id: "mva", type: "serviceTask", label: "MVA-beregning", position: { x: 600, y: 0 }, metadata: {} },
      { id: "payroll", type: "serviceTask", label: "Lønnsjustering", position: { x: 600, y: 200 }, metadata: {} },
      { id: "join", type: "parallelGateway", label: "Samle", position: { x: 800, y: 100 }, metadata: {} },
      { id: "report", type: "serviceTask", label: "Generer rapport", position: { x: 1000, y: 100 }, metadata: {} },
      { id: "review", type: "userTask", label: "Revisor gjennomgang", position: { x: 1200, y: 100 }, metadata: {} },
      { id: "end", type: "endEvent", label: "Avsluttet", position: { x: 1400, y: 100 }, metadata: {} },
    ],
    edges: [
      { id: "e1", source: "start", target: "reconcile" },
      { id: "e2", source: "reconcile", target: "fork" },
      { id: "e3", source: "fork", target: "mva" },
      { id: "e4", source: "fork", target: "payroll" },
      { id: "e5", source: "mva", target: "join" },
      { id: "e6", source: "payroll", target: "join" },
      { id: "e7", source: "join", target: "report" },
      { id: "e8", source: "report", target: "review" },
      { id: "e9", source: "review", target: "end" },
    ],
  },
  {
    id: "year-end",
    name: "Årsoppgjør",
    description: "Komplett årsoppgjørsprosess med avstemming, rapportering og godkjenning",
    category: "Regnskap",
    tags: ["årsoppgjør", "regnskap"],
    nodes: [
      { id: "start", type: "startEvent", label: "Årsoppgjør start", position: { x: 0, y: 100 }, metadata: {} },
      { id: "close", type: "serviceTask", label: "Lukk perioder", position: { x: 200, y: 100 }, metadata: {} },
      { id: "reconcile", type: "serviceTask", label: "Fullstendig avstemming", position: { x: 400, y: 100 }, metadata: {} },
      { id: "report", type: "serviceTask", label: "Generer årsregnskap", position: { x: 600, y: 100 }, metadata: {} },
      { id: "audit", type: "userTask", label: "Revisor revisjon", position: { x: 800, y: 100 }, metadata: {} },
      { id: "approve", type: "userTask", label: "Styregodkjenning", position: { x: 1000, y: 100 }, metadata: {} },
      { id: "submit", type: "serviceTask", label: "Send til Brønnøysund", position: { x: 1200, y: 100 }, metadata: {} },
      { id: "end", type: "endEvent", label: "Årsoppgjør fullført", position: { x: 1400, y: 100 }, metadata: {} },
    ],
    edges: [
      { id: "e1", source: "start", target: "close" },
      { id: "e2", source: "close", target: "reconcile" },
      { id: "e3", source: "reconcile", target: "report" },
      { id: "e4", source: "report", target: "audit" },
      { id: "e5", source: "audit", target: "approve" },
      { id: "e6", source: "approve", target: "submit" },
      { id: "e7", source: "submit", target: "end" },
    ],
  },
];

/** Hent alle maler, eventuelt filtrert */
export function getTemplates(category?: string): ProcessTemplate[] {
  if (category) {
    return PROCESS_TEMPLATES.filter((t) => t.category === category);
  }
  return PROCESS_TEMPLATES;
}

/** Klon en mal til en ny prosess */
export function cloneTemplate(
  template: ProcessTemplate
): { nodes: ProcessNode[]; edges: ProcessEdge[] } {
  return {
    nodes: JSON.parse(JSON.stringify(template.nodes)),
    edges: JSON.parse(JSON.stringify(template.edges)),
  };
}

/** Hent unike kategorier */
export function getTemplateCategories(): string[] {
  return [...new Set(PROCESS_TEMPLATES.map((t) => t.category))];
}
