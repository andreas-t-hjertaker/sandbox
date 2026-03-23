/**
 * Cloud Actions — strukturert output-schema for UI-navigasjon.
 *
 * LLM-en returnerer CloudAction-objekter som forteller skyen
 * hva den skal gjøre: navigere, snakke, vise data, eller starte en tour.
 */

import { z } from "zod";

/** Naviger til et element og highlight det */
export const NavigateActionSchema = z.object({
  type: z.literal("navigate"),
  targetId: z.string(),
  message: z.string(),
  highlight: z.boolean().default(true),
});

/** Vis en snakkeboble */
export const SpeakActionSchema = z.object({
  type: z.literal("speak"),
  message: z.string(),
  variant: z.enum(["info", "success", "warning"]).default("info"),
  autoHide: z.number().optional(),
});

/** Vis strukturert data */
export const DataActionSchema = z.object({
  type: z.literal("data"),
  title: z.string(),
  table: z
    .object({
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    })
    .optional(),
  list: z.array(z.string()).optional(),
  actions: z
    .array(
      z.object({
        label: z.string(),
        actionId: z.string(),
      })
    )
    .optional(),
});

/** Start en flerstegs tour */
export const TourActionSchema = z.object({
  type: z.literal("tour"),
  steps: z.array(
    z.object({
      targetId: z.string(),
      message: z.string(),
    })
  ),
});

/** Ingen handling — skyen forblir idle */
export const IdleActionSchema = z.object({
  type: z.literal("idle"),
});

/** Diskriminert union av alle handlingstyper */
export const CloudActionSchema = z.discriminatedUnion("type", [
  NavigateActionSchema,
  SpeakActionSchema,
  DataActionSchema,
  TourActionSchema,
  IdleActionSchema,
]);

export type CloudAction = z.infer<typeof CloudActionSchema>;
export type NavigateAction = z.infer<typeof NavigateActionSchema>;
export type SpeakAction = z.infer<typeof SpeakActionSchema>;
export type DataAction = z.infer<typeof DataActionSchema>;
export type TourAction = z.infer<typeof TourActionSchema>;

/**
 * Parser `cloud-action` kodeblokker fra LLM-respons.
 *
 * LLM-svar kan inneholde vanlig tekst + en kodeblokk:
 * ```cloud-action
 * { "type": "navigate", "targetId": "kpi-card", ... }
 * ```
 */
export function parseCloudActions(response: string): {
  text: string;
  actions: CloudAction[];
} {
  const actions: CloudAction[] = [];
  const codeBlockRegex = /```cloud-action\s*\n([\s\S]*?)\n```/g;

  let text = response;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const result = CloudActionSchema.safeParse(parsed);
      if (result.success) {
        actions.push(result.data);
      }
    } catch {
      // Ignorerer ugyldig JSON — graceful failure
    }
  }

  // Fjern kodeblokker fra teksten
  text = text.replace(/```cloud-action\s*\n[\s\S]*?\n```/g, "").trim();

  return { text, actions };
}

/**
 * Bygg element-kontekst for LLM system-promptet.
 * Genererer en kompakt "page map" som forteller LLM-en hva som finnes på siden.
 */
export function buildElementContext(
  currentPath: string,
  elements: { id: string; label: string; type?: string; hint?: string }[]
): string {
  if (elements.length === 0) return "";

  const elementList = elements
    .map((el) => {
      const parts = [`id: "${el.id}"`, `label: "${el.label}"`];
      if (el.type) parts.push(`type: "${el.type}"`);
      if (el.hint) parts.push(`hint: "${el.hint}"`);
      return `  { ${parts.join(", ")} }`;
    })
    .join(",\n");

  return [
    "",
    "Tilgjengelige UI-elementer på nåværende side:",
    `Side: ${currentPath}`,
    `Elementer:\n[\n${elementList}\n]`,
    "",
    "Du kan referere til elementer via cloud-action kodeblokker.",
    'Eksempel: ```cloud-action\n{ "type": "navigate", "targetId": "element-id", "message": "Se her", "highlight": true }\n```',
  ].join("\n");
}
