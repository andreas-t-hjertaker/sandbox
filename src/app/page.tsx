"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Boxes,
  Cloud,
  Code2,
  GitBranch,
  Layers,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Agent-drevet",
    description:
      "AI-agenter som selvstendig bygger, deployer og forvalter mikrotjenester.",
  },
  {
    icon: Boxes,
    title: "Mikrotjenester",
    description:
      "Automatisk orkestrering av tjenester som skalerer uavhengig.",
  },
  {
    icon: GitBranch,
    title: "GitOps",
    description:
      "Infrastruktur som kode. Agenter committer, reviewer og deployer.",
  },
  {
    icon: Shield,
    title: "Sikkerhet",
    description:
      "Innebygde regler og guardrails for alt agentene gjør.",
  },
  {
    icon: Zap,
    title: "Sanntid",
    description:
      "Live overvåking og respons. Agenter reagerer på hendelser umiddelbart.",
  },
  {
    icon: Code2,
    title: "Utvidbart",
    description:
      "Åpent rammeverk for egne agenter, plugins og integrasjoner.",
  },
];

const stack = [
  "Next.js",
  "TypeScript",
  "Firebase",
  "Firestore",
  "Cloud Storage",
  "shadcn/ui",
  "Tailwind CSS",
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            <span className="font-semibold tracking-tight">ketl cloud</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-xs">
              v0.1.0
            </Badge>
            <a
              href="https://github.com/andreas-t-hjertaker/sandbox"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm">
                GitHub
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <Badge variant="outline" className="mb-4 font-mono">
            <Layers className="mr-1.5 h-3 w-3" />
            Under utvikling
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Mikrotjenester
            <br />
            drevet av AI-agenter
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            ketl cloud er et system hvor autonome agenter bygger, deployer og
            forvalter mikrotjenester — fra kode til produksjon.
          </p>
          <div className="mt-8 flex gap-3">
            <Button size="lg">Kom i gang</Button>
            <Button variant="outline" size="lg">
              Dokumentasjon
            </Button>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-5xl" />

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Funksjoner
        </h2>
        <p className="mb-10 text-2xl font-semibold tracking-tight">
          Alt en agent trenger for å forvalte tjenester
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-border/50 bg-card/50">
              <CardHeader className="pb-3">
                <f.icon className="mb-2 h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {f.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="mx-auto max-w-5xl" />

      {/* Stack */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Stack
        </h2>
        <p className="mb-8 text-2xl font-semibold tracking-tight">
          Bygget med moderne verktøy
        </p>
        <div className="flex flex-wrap gap-2">
          {stack.map((s) => (
            <Badge key={s} variant="secondary" className="px-3 py-1 text-sm">
              {s}
            </Badge>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cloud className="h-4 w-4" />
            <span>ketl cloud</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">2026</p>
        </div>
      </footer>
    </div>
  );
}
