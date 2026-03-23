"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, GitBranch } from "lucide-react";
import { listProcessDefinitions } from "@/modules/process-designer/api/firestore";
import { useAuth } from "@/hooks/use-auth";

type ProcessSummary = {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published" | "archived";
  version: number;
  updatedAt: Date;
};

const statusLabels: Record<string, string> = {
  draft: "Utkast",
  published: "Publisert",
  archived: "Arkivert",
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  published: "default",
  draft: "outline",
  archived: "secondary",
};

export default function ProsesserPage() {
  const { user } = useAuth();
  const [processes, setProcesses] = useState<ProcessSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    listProcessDefinitions(user.uid)
      .then((docs) => {
        setProcesses(
          docs.map((doc) => ({
            id: doc.id,
            name: doc.name,
            description: doc.description,
            status: doc.status,
            version: doc.version,
            updatedAt: doc.updatedAt?.toDate?.() ?? new Date(),
          }))
        );
      })
      .catch(() => setProcesses([]))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prosesser</h1>
          <p className="text-sm text-muted-foreground">
            Design og administrer forretningsprosesser med AI-assistert BPMN
          </p>
        </div>
        <Link href="/dashboard/prosesser/ny">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ny prosess
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
      ) : processes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <GitBranch className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="font-medium">Ingen prosesser ennå</h3>
            <p className="text-sm text-muted-foreground">
              Opprett din første prosess med AI-assistert designer
            </p>
          </div>
          <Link href="/dashboard/prosesser/ny">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Opprett prosess
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processes.map((p) => (
            <Link key={p.id} href={`/dashboard/prosesser/${p.id}`}>
              <Card className="flex flex-col gap-2 p-4 transition-colors hover:bg-accent/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{p.name}</h3>
                  <Badge variant={statusVariant[p.status]}>
                    {statusLabels[p.status]}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {p.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  v{p.version} — sist oppdatert{" "}
                  {p.updatedAt.toLocaleDateString("nb-NO")}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
