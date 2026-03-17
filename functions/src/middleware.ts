import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";
import * as admin from "firebase-admin";
import { z, type ZodSchema } from "zod";

// ============================================================
// Typed response-hjelpere
// ============================================================

export function success<T>(res: Response, data: T, status = 200) {
  res.status(status).json({ success: true, data });
}

export function fail(res: Response, message: string, status = 400) {
  res.status(status).json({ success: false, error: message });
}

// ============================================================
// Typer for rute-handlers
// ============================================================

/** Kontekst som sendes til alle handlers */
export type RouteContext = {
  req: Request;
  res: Response;
};

/** Kontekst for autentiserte handlers */
export type AuthenticatedContext = RouteContext & {
  user: DecodedIdToken;
};

/** Kontekst for validerte handlers */
export type ValidatedContext<T> = AuthenticatedContext & {
  data: T;
};

/** Enkel handler uten auth */
type PublicHandler = (ctx: RouteContext) => Promise<void> | void;

/** Handler med autentisert bruker */
type AuthHandler = (ctx: AuthenticatedContext) => Promise<void> | void;

/** Handler med autentisering og validert body */
type ValidatedHandler<T> = (ctx: ValidatedContext<T>) => Promise<void> | void;

// ============================================================
// Middleware-wrappers
// ============================================================

/**
 * Wrapper som verifiserer Firebase ID-token.
 * Returnerer 401 hvis tokenet mangler eller er ugyldig.
 *
 * Bruk:
 *   const getMe = withAuth(async ({ user, res }) => {
 *     success(res, { uid: user.uid, email: user.email });
 *   });
 */
export function withAuth(handler: AuthHandler): PublicHandler {
  return async ({ req, res }) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      fail(res, "Ikke autentisert", 401);
      return;
    }

    try {
      const token = header.split("Bearer ")[1];
      const user = await admin.auth().verifyIdToken(token);
      await handler({ req, res, user });
    } catch {
      fail(res, "Ugyldig eller utløpt token", 401);
      return;
    }
  };
}

/**
 * Wrapper som verifiserer auth + validerer request body med Zod.
 * Returnerer 400 med valideringsfeil hvis body er ugyldig.
 *
 * Bruk:
 *   const createNote = withValidation(createNoteSchema, async ({ user, data, res }) => {
 *     const note = await db.collection("notes").add({ ...data, userId: user.uid });
 *     success(res, { id: note.id, ...data }, 201);
 *   });
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: ValidatedHandler<T>
): PublicHandler {
  return withAuth(async ({ req, res, user }) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e: z.ZodIssue) => e.message).join(", ");
      fail(res, messages);
      return;
    }
    await handler({ req, res, user, data: parsed.data });
  });
}
