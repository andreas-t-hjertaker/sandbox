# Arkitektur — Process Agent Designer

## Overordnet arkitektur

```
┌────────────────────────────────────────────────────┐
│                   Next.js Frontend                  │
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Chat     │  │  BPMN Canvas │  │  Properties  │ │
│  │  Panel    │  │  (ReactFlow) │  │  Panel       │ │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘ │
│       │               │                  │          │
│  ┌────┴───────────────┴──────────────────┴───────┐ │
│  │           Process Designer Store              │ │
│  │         (React Context + useReducer)          │ │
│  └────────────────────┬──────────────────────────┘ │
│                       │                             │
│  ┌────────────────────┴──────────────────────────┐ │
│  │            Firestore API Layer                │ │
│  └────────────────────┬──────────────────────────┘ │
└───────────────────────┼─────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────┐
│              Firebase Backend                      │
│                                                    │
│  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  Firestore   │  │  Cloud     │  │  Firebase  │ │
│  │  Database    │  │  Functions │  │  Auth      │ │
│  └──────────────┘  └────────────┘  └───────────┘ │
└───────────────────────────────────────────────────┘
```

## Dataflyt

1. **Chat → LLM → Canvas**: Bruker beskriver prosess i chat → LLM returnerer JSON patches → Canvas oppdateres
2. **Canvas → Properties**: Bruker klikker node → Properties panel åpnes med konfig
3. **Canvas → Validation**: Bruker trykker "Valider" → Strukturell/semantisk sjekk → Feil vises inline
4. **Canvas → Deploy**: Validert prosess → Deploy-konfigurasjon → Agent runtime

## Firestore-skjema

```
processDefinitions/{processId}
├── name, description, version, status, createdBy
├── nodes[], edges[]
├── versions/{versionId}        # Versjonshistorikk
├── messages/{messageId}        # Chat-meldinger
└── instances/{instanceId}      # Kjørende instanser
    ├── auditLog/{logId}        # Revisjonsspor
    └── dlq/{dlqId}             # Dead Letter Queue

mcpServers/{serverId}           # MCP-serverregister
```

## BPMN-nodetyper

| Type | Visuell | Bruk |
|------|---------|------|
| startEvent | Grønn sirkel | Trigger for prosessen |
| endEvent | Rød sirkel, tykk kant | Sluttilstand |
| serviceTask | Rektangel + tannhjul | Automatisert steg |
| userTask | Rektangel + person | Manuelt steg |
| exclusiveGateway | Diamant + X | XOR-beslutning |
| parallelGateway | Diamant + + | AND-parallellisering |
| timerEvent | Sirkel + klokke | Tidsstyrt hendelse |
| errorEvent | Sirkel + varseltrekant | Feilhåndtering |

## Autonominivåer

| Nivå | Beskrivelse | Risiko |
|------|------------|--------|
| 1 | Kun forslag | Ingen |
| 2 | Utfør med logging | Lav |
| 3 | Utfør med varsling | Middels |
| 4 | Full autonom med spending cap | Høy |
| 5 | Full autonom | Svært høy |

## Faser i prosessdesign

1. **Kartlegging**: Chat-basert kartlegging av prosessen
2. **Strukturering**: LLM konverterer til BPMN-noder og kanter
3. **Agentifisering**: AI foreslår autonominivå og verktøy per steg
4. **Validering**: Strukturell og semantisk sjekk før deploy
