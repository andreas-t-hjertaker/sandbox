# Process Agent Designer

En selvstendig modul for å designe, agentifisere og deploye BPMN 2.0 prosesser med AI-assistanse.

## Installasjon

Modulen er en del av sandbox-prosjektet. Avhengigheter:

```bash
npm install @xyflow/react @dagrejs/dagre react-resizable-panels
```

## Hurtigstart

```tsx
import { ProcessDesignerProvider } from "@/modules/process-designer";

// Bruk i din Next.js-side:
// Se src/app/dashboard/prosessdesigner/page.tsx for komplett eksempel
```

## Mappestruktur

```
src/modules/process-designer/
├── types/          # TypeScript-typer og Zod-skjemaer
├── constants/      # MCP-servere, maler, layout-konstanter
├── lib/            # Forretningslogikk (validering, layout, export, LLM)
├── api/            # Firestore CRUD-operasjoner
├── store/          # React Context state management
├── hooks/          # Custom React hooks
├── components/     # UI-komponenter
│   ├── canvas/     # ReactFlow canvas + BPMN-noder
│   ├── chat/       # Chat-panel med faseindikator
│   ├── properties/ # Node-konfigurasjonspanel
│   ├── layout/     # Split-view layout
│   ├── mcp-library/# MCP-integrasjonsbibliotek
│   ├── validation/ # Valideringspanel
│   ├── deploy/     # Deploy-panel
│   ├── dashboard/  # Prosess-status dashboard
│   ├── templates/  # Mal-galleri
│   ├── export/     # BPMN XML/JSON eksport/import
│   ├── agentify/   # Agentifiseringsforslag
│   ├── autonomy/   # Graderbar autonomi-konfig
│   ├── audit/      # Revisjonsspor-viewer
│   ├── dlq/        # Dead Letter Queue
│   ├── domain-rules/# Domeneregelredigering
│   ├── collaboration/# Samarbeidsvisning
│   └── versioning/ # Versjonsdiff og rollback
└── __tests__/      # Unit-tester
```

## Avhengigheter

- `@xyflow/react` — ReactFlow for canvas
- `@dagrejs/dagre` — Automatisk graf-layout
- `react-resizable-panels` — Resizable split-view
- `firebase` — Firestore for persistering
- `zod` — Runtime-validering
- `lucide-react` — Ikoner
- `react-markdown` — Markdown-rendering i chat
- `framer-motion` — Animasjoner
