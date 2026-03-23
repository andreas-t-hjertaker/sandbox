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
│   └── telemetry.ts            # LLM-metrikker
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

## MCP-servere

Forhåndsdefinerte integrasjoner: Xero, Tripletex, Stripe, Vipps,
Brønnøysundregistrene, DNB Open Banking, EHF/PEPPOL.

## Testing

```bash
npm test -- --filter process-designer
```
