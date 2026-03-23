# Process Designer Module

BPMN 2.0 prosessdesigner med AI-agentifisering for ketl cloud.

## Installasjon

Modulen er en del av ketl cloud sandbox. Importeres fra:

```tsx
import {
  SplitViewLayout,
  DesignerChat,
  BPMNCanvas,
  validateProcess,
  autoLayout,
} from "@/modules/process-designer";
```

## Arkitektur

```
src/modules/process-designer/
├── components/          # UI-komponenter
│   ├── split-view-layout.tsx   # Tredeilt Chat+Canvas+Properties
│   ├── designer-chat.tsx       # AI-drevet chat med faseindikator
│   ├── bpmn-canvas.tsx         # SVG-basert BPMN-visualisering
│   ├── bpmn-nodes.tsx          # Custom nodekomponenter
│   ├── properties-panel.tsx    # Nodekonfigurasjon
│   ├── mcp-library.tsx         # MCP-verktøybibliotek
│   ├── mcp-node-config.tsx     # MCP-verktøykonfigurasjon
│   └── process-status-dashboard.tsx
├── hooks/               # React hooks
│   └── use-streaming-process.ts
├── lib/                 # Kjernlogikk
│   ├── llm-orchestrator.ts     # LLM structured output
│   ├── bpmn-validator.ts       # Strukturell/semantisk validering
│   ├── auto-layout.ts          # Hierarkisk layout-algoritme
│   ├── agentify.ts             # Agentifiseringsforslag
│   ├── process-deploy.ts       # BPMN → executable pipeline
│   ├── process-export.ts       # BPMN 2.0 XML / JSON
│   ├── process-templates.ts    # Forhåndsbygde maler
│   ├── process-versioning.ts   # Diff og rollback
│   ├── process-rules.ts        # Domeneregler per prosess
│   ├── collaboration.ts        # Sanntidssamarbeid
│   ├── autonomy.ts             # Graderbar autonomi
│   ├── audit-trail.ts          # Revisjonsspor
│   ├── dead-letter-queue.ts    # Feilhåndtering
│   ├── idempotent-handler.ts   # Sikker re-kjøring
│   └── telemetry.ts            # LLM-metrikker og telemetri
├── api/                 # Firestore-operasjoner
│   ├── firestore.ts            # Process CRUD
│   └── mcp-registry.ts         # MCP-servere
├── types/               # TypeScript-typer
│   ├── process-types.ts        # BPMN + agentmodell
│   └── schemas.ts              # Zod v4-skjemaer
├── constants/           # Konfigurasjon
├── __tests__/           # Vitest-tester
└── index.ts             # Public API
```

### Firestore-skjema

| Samling | Dokument-ID | Innhold |
|---------|------------|---------|
| `processDefinitions` | auto | Noder, kanter, metadata, versjon |
| `processDefinitions/{id}/versions` | auto | Versjonssnapshoter |
| `processDefinitions/{id}/auditLog` | auto | Audit-hendelser |
| `processDefinitions/{id}/collaboration/cursors` | fast | Cursor-posisjoner per bruker |
| `processRules` | `global`, `org_{id}`, `process_{id}` | Markdown-regler med scope |
| `deadLetterQueue` | auto | Feilede agentkjøringer |
| `idempotencyKeys` | `{eventId}_{stepId}` | Idempotent resultatcache |
| `telemetryEvents` | auto | LLM- og agentkjøring-metrikker |

## Samtalefaser

Prosessdesigneren guider brukeren gjennom 4 faser:

1. **Kartlegging** — Forstå prosessen via spørsmål
2. **Strukturering** — Konverter til BPMN-noder og kanter
3. **Agentifisering** — Foreslå autonominivå per steg
4. **Validering** — Verifiser komplett prosess

## BPMN-elementer

| Type | Visuelt | Bruk |
|------|---------|------|
| startEvent | Grønn sirkel | Trigger for prosessen |
| endEvent | Rød sirkel | Prosessen avsluttes |
| serviceTask | Blått rektangel | Automatisert AI-steg |
| userTask | Grønt rektangel | Human-in-the-loop |
| exclusiveGateway | Gul diamant (✕) | Beslutning (if/else) |
| parallelGateway | Gul diamant (+) | Parallell utførelse |
| timerEvent | Lilla sirkel | Tidsbasert trigger |
| errorEvent | Rød sirkel | Feilhåndtering |

## Autonominivåer

| Nivå | Beskrivelse |
|------|------------|
| 1 | Kun forslag — agenten gjør ingenting |
| 2 | Utfør med logging |
| 3 | Utfør med varsling |
| 4 | Full autonom med budsjettgrense |
| 5 | Full autonom |

## API-referanse

### Validering

```ts
import { validateProcess } from "@/modules/process-designer";

const result = validateProcess(nodes, edges);
// → { valid: boolean, issues: ValidationIssue[], summary: { errors, warnings, infos } }
```

### Auto-layout

```ts
import { autoLayout, layoutNewNodes } from "@/modules/process-designer";

const layoutedNodes = autoLayout(nodes, edges);           // Layout hele prosessen
const updated = layoutNewNodes(existingNodes, newNodes, edges); // Kun nye noder
```

### Versjonering

```ts
import { diffVersions, isSignificantChange } from "@/modules/process-designer";

const diff = diffVersions(beforeVersion, afterVersion);
// → { addedNodes, removedNodes, modifiedNodes, addedEdges, removedEdges }

if (isSignificantChange(diff)) {
  // Lagre ny versjon automatisk (ignorerer rene posisjonsendringer)
}
```

### Autonomi og eskalering

```ts
import { requiresEscalation, defaultAutonomyForRisk } from "@/modules/process-designer";

const config = defaultAutonomyForRisk("medium"); // → { level: 3, confidenceThreshold: 0.8 }

const { escalate, reason } = requiresEscalation(config, confidence, amountNOK);
if (escalate) {
  // Send til menneskelig godkjenner
}
```

### Audit Trail

```ts
import { logAuditEntry, getAuditLog, exportAuditToCSV } from "@/modules/process-designer";

await logAuditEntry("process-id", {
  action: "agent_execute",
  actor: { type: "agent", uid: "agent-1", name: "Faktura-agent" },
  reasoning: "Godkjent basert på beløp under terskel",
  autonomyLevel: 3,
  confidence: 0.92,
  durationMs: 1500,
});

const log = await getAuditLog("process-id");
const csv = exportAuditToCSV(log); // Last ned som CSV
```

### Dead Letter Queue

```ts
import {
  addToDLQ, getDLQEntries, retryDLQEntry, escalateDLQEntry, resolveDLQEntry,
  calculateBackoff, shouldMoveToDLQ,
} from "@/modules/process-designer";

// Legg feilet kjøring i DLQ
await addToDLQ({
  processId: "p1", instanceId: "i1", stepId: "s1", stepLabel: "Opprett faktura",
  error: "Xero API timeout", input: { invoiceData },
});

// Retry med eksponentiell backoff
const delay = calculateBackoff(attempt); // 2s, 4s, 8s
if (shouldMoveToDLQ(attempt)) {
  await escalateDLQEntry(entryId, "user-uid");
} else {
  await retryDLQEntry(entryId, attempt);
}
```

### Domeneregler

```ts
import { getEffectiveRules, saveRules, rulesToPromptSection } from "@/modules/process-designer";

// Regler arves: global → org → prosess
const rules = await getEffectiveRules("org-id", "process-id");
const promptSection = rulesToPromptSection(rules);
// → "--- DOMENEREGLER (MÅ FØLGES) ---\n..."

await saveRules("process_abc", "process", "- Alltid bruk NOK\n- Maks 5 iterasjoner", "user-uid");
```

### Samarbeid (realtime)

```ts
import { subscribeToCursors, updateCursor, removeCursor } from "@/modules/process-designer";

// Abonner på andre brukeres cursorer
const unsubscribe = subscribeToCursors("process-id", (cursors) => {
  // cursors: Record<uid, { displayName, color, position, selectedNodeId }>
});

// Oppdater egen posisjon
await updateCursor("process-id", {
  uid: "user-1", displayName: "Ola", color: "#3b82f6",
  position: { x: 100, y: 200 }, lastSeen: new Date(),
});

// Rydd opp ved disconnect
await removeCursor("process-id", "user-1");
unsubscribe();
```

### Idempotent handlers

```ts
import { executeIdempotent, generateIdempotencyKey } from "@/modules/process-designer";

const { result, alreadyProcessed } = await executeIdempotent(
  "event-123", "step-4",
  async () => {
    // Denne kjøres kun én gang — resultat caches
    return await xeroApi.createInvoice(data);
  }
);

const key = generateIdempotencyKey("event-123", "step-4", "xero.createInvoice");
```

### Telemetri

```ts
import {
  trackLLMCall, trackAgentRun, startTelemetry,
  aggregateProcessMetrics, setTelemetryExporter, useOtelExporter,
} from "@/modules/process-designer";

// Start periodisk flushing (standard: Firestore)
const stopTelemetry = startTelemetry();

// Valgfritt: bruk OpenTelemetry HTTP exporter
useOtelExporter("https://otel-collector.example.com/v1/traces");

// Eller: custom exporter (f.eks. Langfuse)
setTelemetryExporter(async (batch) => {
  await langfuse.trackBatch(batch);
});

// Spor LLM-kall
trackLLMCall({
  callId: "c1", model: "gemini-2.5-flash",
  promptTokens: 500, completionTokens: 200, totalTokens: 700,
  latencyMs: 340, cost: estimateCost("gemini-2.5-flash", 500, 200),
  processId: "p1", timestamp: new Date(),
});

// Aggreger metrikker
const agg = aggregateProcessMetrics(runs);
// → { totalRuns, avgDurationMs, totalTokens, totalCost, successRate }

stopTelemetry(); // Stopper intervall og flusher resterende
```

### Eksport/Import

```ts
import { exportToBPMNXML, importFromBPMNXML, exportToJSON, importFromJSON } from "@/modules/process-designer";

const xml = exportToBPMNXML(nodes, edges, metadata);   // BPMN 2.0 XML
const { nodes, edges } = importFromBPMNXML(xml);        // Parse tilbake
const json = exportToJSON(definition);                   // JSON-snapshot
const def = importFromJSON(json);                        // Parse tilbake
```

### Maler

```ts
import { getTemplates, cloneTemplate, getTemplateCategories } from "@/modules/process-designer";

const categories = getTemplateCategories(); // ["Regnskap", "HR", ...]
const templates = getTemplates("Regnskap");
const definition = cloneTemplate("faktura-godkjenning");
```

## MCP-servere

Forhåndsdefinerte integrasjoner: Xero, Tripletex, Stripe, Vipps,
Brønnøysundregistrene, DNB Open Banking, EHF/PEPPOL.

## Testing

```bash
npm test -- --filter process-designer
```

Testfiler dekker: validering, auto-layout, LLM-orchestrator, eksport/import,
autonomi, telemetri, versjonering, DLQ, audit trail, domeneregler,
samarbeid og idempotent handlers.
