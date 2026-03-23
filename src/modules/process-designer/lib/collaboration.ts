/**
 * Samarbeidsvisning — Firestore realtime listeners for concurrent editing (#23).
 */

import {
  subscribeToDocument,
  updateDocument,
} from "@/lib/firebase/firestore";

export type UserCursor = {
  uid: string;
  displayName: string;
  color: string;
  position: { x: number; y: number };
  selectedNodeId?: string;
  lastSeen: Date;
};

export type ProcessComment = {
  id: string;
  nodeId: string;
  authorUid: string;
  authorName: string;
  content: string;
  createdAt: Date;
};

const CURSOR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

/** Tildel en farge basert på UID */
export function getCursorColor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

/** Abonner på cursor-oppdateringer for en prosess */
export function subscribeToCursors(
  processId: string,
  callback: (cursors: Record<string, UserCursor>) => void
) {
  return subscribeToDocument<{ cursors: Record<string, UserCursor> }>(
    "processDefinitions",
    `${processId}/collaboration/cursors`,
    (data) => {
      callback(data?.cursors || {});
    }
  );
}

/** Oppdater egen cursor-posisjon */
export async function updateCursor(
  processId: string,
  cursor: UserCursor
) {
  return updateDocument(
    "processDefinitions",
    `${processId}/collaboration/cursors`,
    { [`cursors.${cursor.uid}`]: cursor }
  );
}

/** Fjern egen cursor (disconnect) */
export async function removeCursor(processId: string, uid: string) {
  return updateDocument(
    "processDefinitions",
    `${processId}/collaboration/cursors`,
    { [`cursors.${uid}`]: null }
  );
}
