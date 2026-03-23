"use client";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  type User,
  type Unsubscribe,
  type ActionCodeSettings,
} from "firebase/auth";
import { app } from "./config";

export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

// ─── Google ──────────────────────────────────────────────

/** Logg inn med Google via redirect (unngår popup-blokkering) */
export async function signInWithGoogle() {
  return signInWithRedirect(auth, googleProvider);
}

/** Hent resultat etter Google redirect-innlogging */
export async function getGoogleRedirectResult() {
  return getRedirectResult(auth);
}

// ─── E-post / passord ────────────────────────────────────

/** Logg inn med e-post og passord */
export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/** Opprett ny bruker med e-post og passord */
export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/** Send e-post for tilbakestilling av passord */
export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

// ─── E-postlenke (passordløs) ────────────────────────────

/**
 * Send en innloggingslenke til brukerens e-post.
 * `url` er adressen brukeren sendes tilbake til etter klikk (default: /login).
 */
export async function sendEmailLink(email: string, url?: string) {
  const actionCodeSettings: ActionCodeSettings = {
    url: url ?? `${window.location.origin}/login`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  // Lagre e-post lokalt slik at vi kan fullføre innlogging på callback
  window.localStorage.setItem("emailForSignIn", email);
}

/** Sjekk om gjeldende URL er en innloggingslenke */
export function isEmailLink(url: string) {
  return isSignInWithEmailLink(auth, url);
}

/** Fullfør innlogging via e-postlenke */
export async function completeEmailLinkSignIn(email: string, url: string) {
  const result = await signInWithEmailLink(auth, email, url);
  window.localStorage.removeItem("emailForSignIn");
  return result;
}

// ─── Anonym ──────────────────────────────────────────────

/** Logg inn anonymt */
export async function signInAnonymous() {
  return firebaseSignInAnonymously(auth);
}

// ─── Felles ──────────────────────────────────────────────

/** Logg ut */
export async function signOutUser() {
  return signOut(auth);
}

/** Lytt på endringer i autentiseringstilstand */
export function onAuthChange(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
