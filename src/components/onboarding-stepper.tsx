"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { updateProfile } from "firebase/auth";
import { uploadFile } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Cloud,
  FileText,
  BarChart3,
  Shield,
  Upload,
  Loader2,
  Rocket,
} from "lucide-react";

const TOTAL_STEPS = 4;

export function OnboardingStepper() {
  const { user, firebaseUser } = useAuth();
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(0);

  // Steg 2 — profil
  const [displayName, setDisplayName] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setChecking(false);
      return;
    }

    getDoc(doc(db, "users", firebaseUser.uid)).then((snap) => {
      if (!snap.exists() || !snap.data()?.onboardingComplete) {
        setDisplayName(firebaseUser.displayName || "");
        setShow(true);
      }
      setChecking(false);
    });
  }, [firebaseUser]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    setAvatarUploading(true);
    try {
      const { url } = await uploadFile(`avatars/${firebaseUser.uid}`, file);
      await updateProfile(firebaseUser, { photoURL: url });
    } catch {
      // Ignorer feil — brukeren kan fortsette uten bilde
    }
    setAvatarUploading(false);
  }

  async function handleComplete() {
    if (!firebaseUser) return;

    // Lagre visningsnavn hvis endret
    if (displayName && displayName !== firebaseUser.displayName) {
      await updateProfile(firebaseUser, { displayName });
    }

    // Marker onboarding som fullført
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      { onboardingComplete: true },
      { merge: true }
    );
    setShow(false);
  }

  async function handleSkip() {
    if (!firebaseUser) return;
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      { onboardingComplete: true },
      { merge: true }
    );
    setShow(false);
  }

  if (checking || !show) return null;

  const initials = (displayName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" data-cloud-id="onboarding-overlay" data-cloud-label="Onboarding" data-cloud-type="modal" data-cloud-hint="Veiviser for nye brukere — sett opp profil og utforsk funksjoner">
      <Card className="mx-4 w-full max-w-lg">
        {/* Fremdriftsprikker */}
        <div className="flex justify-center gap-2 pt-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === step
                  ? "bg-primary"
                  : i < step
                    ? "bg-primary/50"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>

        <CardContent className="p-6">
          {/* Steg 1: Velkommen */}
          {step === 0 && (
            <div className="space-y-4 text-center">
              <Cloud className="mx-auto h-12 w-12 text-primary" />
              <CardTitle className="text-xl">
                Velkommen til ketl cloud!
              </CardTitle>
              <p className="text-muted-foreground">
                La oss gjøre deg klar på et par minutter. Vi hjelper deg med å
                sette opp profilen din og viser deg de viktigste funksjonene.
              </p>
            </div>
          )}

          {/* Steg 2: Profil */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <CardTitle className="text-xl">
                  Sett opp profilen din
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Legg til navn og bilde så andre kan gjenkjenne deg.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={firebaseUser?.photoURL || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Last opp bilde
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Visningsnavn</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ditt navn"
                />
              </div>
            </div>
          )}

          {/* Steg 3: Funksjoner */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <CardTitle className="text-xl">
                  Utforsk nøkkelfunksjoner
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Her er noen av tingene du kan gjøre med ketl cloud.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    icon: FileText,
                    title: "Dokumenter",
                    desc: "Opprett og organiser dokumenter med sanntidslagring.",
                  },
                  {
                    icon: BarChart3,
                    title: "Dashboard",
                    desc: "Få oversikt over aktivitet og nøkkeltall.",
                  },
                  {
                    icon: Shield,
                    title: "API-nøkler",
                    desc: "Generer API-nøkler for integrasjoner.",
                  },
                  {
                    icon: Cloud,
                    title: "AI-assistent",
                    desc: "Spør vår innebygde AI om hva som helst.",
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <feature.icon className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm font-medium">
                        {feature.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {feature.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steg 4: Ferdig */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <Rocket className="mx-auto h-12 w-12 text-primary" />
              <CardTitle className="text-xl">Du er klar!</CardTitle>
              <p className="text-muted-foreground">
                Alt er satt opp. Klikk &laquo;Kom i gang&raquo; for å gå til
                dashboardet.
              </p>
            </div>
          )}
        </CardContent>

        {/* Navigasjon */}
        <CardContent className="flex items-center justify-between border-t pt-4">
          <Button variant="ghost" size="sm" onClick={handleSkip} data-cloud-id="onboarding-hopp-over" data-cloud-label="Hopp over onboarding" data-cloud-type="action">
            Hopp over
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                data-cloud-id="onboarding-forrige" data-cloud-label="Forrige steg" data-cloud-type="action"
              >
                Forrige
              </Button>
            )}
            {step < TOTAL_STEPS - 1 ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)} data-cloud-id="onboarding-neste" data-cloud-label="Neste steg" data-cloud-type="action">
                Neste
              </Button>
            ) : (
              <Button size="sm" onClick={handleComplete} data-cloud-id="onboarding-fullfor" data-cloud-label="Fullfør onboarding" data-cloud-type="action">
                Kom i gang
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
