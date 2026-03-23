# CLAUDE.md — ketl cloud sandbox (boilerplate)

## Hva dette repoet er

SaaS-boilerplate for alle ketl cloud-prosjekter. Next.js 16 + Firebase + shadcn/ui v4 + Tailwind v4.
Klones og tilpasses for hvert nytt prosjekt (f.eks. ketl-regnskap).

## Issues og oppgaver

Det er **ingen issues** i dette repoet. Sandbox er en ferdig boilerplate — features og bugs trackes i prosjektrepoene som klones fra den.

Relaterte repos med issues:
- **ketl-regnskap** (`andreas-t-hjertaker/ketl-regnskap`) — AI-drevet regnskapssystem, 119 issues

## Teknisk stack

- **Framework**: Next.js 16, `output: "export"` (statisk) — INGEN server-side features (ingen SSR, API routes, middleware)
- **UI**: shadcn/ui v4 + Tailwind v4 + @base-ui/react (IKKE Radix)
- **Animasjoner**: framer-motion — se `src/components/motion/`
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions, Hosting)
- **AI**: Firebase AI SDK → Gemini 2.5 Flash (client-side)
- **Betaling**: Stripe (lazy init via `getStripe()` for å unngå CI-krasj)
- **Validering**: Zod v4 (frontend), Zod v3 (functions)
- **Test**: Vitest
- **Node**: 22 (CI og Functions)

## Viktige konvensjoner

### Shadcn v4 — VIKTIG
- `<Button asChild>` finnes IKKE i v4. Bruk `<Link>` direkte med button-styling.
- Komponenter bruker `@base-ui/react`, ikke `@radix-ui`.

### Stripe
- Lazy init: `getStripe()` — IKKE `new Stripe(key)` på toppnivå. CI-deploy krasjer uten dette.

### Firebase
- Prosjekt-ID: `ketlcloud`
- Hosting: https://ketlcloud.web.app
- Auth: Google, Email/Password, Email link, Anonymous

### AI-assistent (modul)
- Ligger i `src/modules/ai-assistant/` — selvstendig modul
- System-prompt bygges dynamisk med brukerkontekst
- Bruker `firebase/ai` SDK direkte fra klienten

## Mappestruktur

```
src/
├── app/                    # Next.js App Router sider
│   ├── admin/              # Admin-panel (brukere, feature flags)
│   ├── dashboard/          # Hovedapp (abonnement, innstillinger, utvikler)
│   ├── login/              # Innlogging
│   └── pricing/            # Prisside
├── components/
│   ├── motion/             # Animasjonskomponenter (framer-motion)
│   └── ui/                 # shadcn/ui-komponenter
├── hooks/                  # React hooks (auth, admin, feature-flags)
├── lib/
│   ├── firebase/           # Firebase config, AI, Firestore helpers
│   └── stripe/             # Stripe config og helpers
├── modules/
│   └── ai-assistant/       # AI-chat modul (komponenter, hooks, prompt)
└── types/                  # TypeScript-typer
functions/                  # Cloud Functions (API, middleware)
```

## CI/CD

Push til `main` → GitHub Actions → build → deploy functions (med `--force`) → deploy hosting.
Workflow: `.github/workflows/firebase-deploy.yml`

## Kommandoer

```bash
npm run dev          # Lokal utvikling
npm run build        # Bygg statisk (next export)
npm test             # Kjør Vitest
```
