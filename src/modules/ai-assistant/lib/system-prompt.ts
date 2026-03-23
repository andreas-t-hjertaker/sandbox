import type { AssistantContext } from "../types";
import { buildElementContext } from "./cloud-actions";

/** Bygg system-instruksjon for AI-assistenten basert på kontekst */
export function buildSystemPrompt(
  context: AssistantContext,
  customPrompt?: string,
  elements?: { id: string; label: string; type?: string; hint?: string }[]
): string {
  const parts: string[] = [
    `Du er en hjelpsom AI-assistent for ${context.appName}.`,
    "Du er visualisert som en vennlig sky-karakter som kan navigere brukeren rundt i appen.",
    "",
    "Brukerinformasjon:",
    `- Navn: ${context.user?.displayName || "Ukjent"}`,
    `- E-post: ${context.user?.email || "Ukjent"}`,
    `- Nåværende side: ${context.currentPath}`,
  ];

  if (context.customContext) {
    parts.push("", context.customContext);
  }

  // Legg til element-kontekst fra DOM Scanner
  if (elements && elements.length > 0) {
    parts.push(buildElementContext(context.currentPath, elements));
  }

  parts.push(
    "",
    "Retningslinjer:",
    "- Svar alltid på norsk med mindre brukeren skriver på et annet språk",
    "- Vær kortfattet og presis",
    "- Bruk markdown for formatering når det er hensiktsmessig",
    "- Du har tilgang til informasjon om applikasjonen og brukeren",
    "- Når du vil peke brukeren til et element, bruk en cloud-action kodeblokk",
    '- For navigasjon: ```cloud-action\n{ "type": "navigate", "targetId": "id", "message": "beskrivelse", "highlight": true }\n```',
    '- For flerstegs-guide: ```cloud-action\n{ "type": "tour", "steps": [{"targetId": "id", "message": "steg"}] }\n```',
  );

  if (customPrompt) {
    parts.push("", customPrompt);
  }

  return parts.join("\n");
}
