"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Workflow, Clock, CheckCircle2, Archive } from "lucide-react";
import { SlideIn, StaggerList, StaggerItem } from "@/components/motion";
import {
  getTemplates,
  type ProcessTemplate,
} from "@/modules/process-designer";

const statusConfig = {
  draft: { label: "Utkast", variant: "outline" as const, icon: Clock },
  published: { label: "Publisert", variant: "default" as const, icon: CheckCircle2 },
  archived: { label: "Arkivert", variant: "secondary" as const, icon: Archive },
};

export default function ProsesserPage() {
  const [templates] = useState<ProcessTemplate[]>(() => getTemplates());

  return (
    <div className="space-y-6">
      <SlideIn direction="up" duration={0.4}>
        <div
          className="flex items-center justify-between"
          data-cloud-id="prosesser-header"
          data-cloud-label="Prosessoversikt"
          data-cloud-type="section"
          data-cloud-hint="Oversikt over alle BPMN-prosesser og maler"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prosesser</h1>
            <p className="text-muted-foreground">
              Design, agentifiser og distribuer BPMN-prosesser.
            </p>
          </div>
          <Link
            href="/dashboard/prosesser/ny"
            data-cloud-id="ny-prosess-knapp"
            data-cloud-label="Opprett ny prosess"
            data-cloud-type="action"
            data-cloud-hint="Åpner prosessdesigneren for å opprette en ny prosess"
          >
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ny prosess
            </Button>
          </Link>
        </div>
      </SlideIn>

      {/* Maler */}
      <div>
        <SlideIn direction="up" delay={0.1}>
          <h2
            className="mb-4 text-lg font-semibold"
            data-cloud-id="maler-header"
            data-cloud-label="Prosessmaler"
            data-cloud-type="section"
            data-cloud-hint="Forhåndsbygde maler for vanlige regnskapsprosesser"
          >
            Prosessmaler
          </h2>
        </SlideIn>
        <StaggerList
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.06}
        >
          {templates.map((template) => (
            <StaggerItem key={template.id}>
              <Link href={`/dashboard/prosesser/ny?mal=${template.id}`}>
                <Card
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                  data-cloud-id={`mal-${template.id}`}
                  data-cloud-label={template.name}
                  data-cloud-type="template"
                  data-cloud-hint={template.description}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Workflow className="h-5 w-5 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                    <div className="mt-3 flex gap-1.5">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {template.nodes.length} noder &middot; {template.edges.length} koblinger
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </div>
  );
}
