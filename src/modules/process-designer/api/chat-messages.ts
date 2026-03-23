import {
  getCollection,
  getDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
} from "@/lib/firebase/firestore";
import { orderBy, where } from "firebase/firestore";
import type { ChatMessage, ChatPhase } from "../types";

// ─── Collection path ───────────────────────────────────────────────

const messagesPath = (processId: string) =>
  `processDefinitions/${processId}/messages`;

// ─── Read ──────────────────────────────────────────────────────────

export async function getMessages(processId: string) {
  return getCollection<ChatMessage>(
    messagesPath(processId),
    orderBy("timestamp", "asc"),
  );
}

export async function getMessagesByPhase(
  processId: string,
  phase: ChatPhase,
) {
  return getCollection<ChatMessage>(
    messagesPath(processId),
    where("phase", "==", phase),
    orderBy("timestamp", "asc"),
  );
}

export async function getMessage(processId: string, messageId: string) {
  return getDocument<ChatMessage>(messagesPath(processId), messageId);
}

// ─── Write ─────────────────────────────────────────────────────────

export type CreateMessageInput = Omit<ChatMessage, "id" | "timestamp">;

export async function addMessage(
  processId: string,
  data: CreateMessageInput,
) {
  const ref = await addDocument(messagesPath(processId), data);
  return ref.id;
}

export async function updateMessage(
  processId: string,
  messageId: string,
  data: Partial<Pick<ChatMessage, "content" | "patches" | "suggestions">>,
) {
  return updateDocument(messagesPath(processId), messageId, data);
}

export async function deleteMessage(processId: string, messageId: string) {
  return deleteDocument(messagesPath(processId), messageId);
}

// ─── Bulk operations ───────────────────────────────────────────────

export async function clearMessages(processId: string) {
  const messages = await getMessages(processId);
  const deletePromises = messages.map((msg) =>
    deleteDocument(messagesPath(processId), msg.id),
  );
  await Promise.all(deletePromises);
}

// ─── Real-time listeners ───────────────────────────────────────────

export function subscribeToMessages(
  processId: string,
  callback: (messages: (ChatMessage & { id: string })[]) => void,
) {
  return subscribeToCollection<ChatMessage>(
    messagesPath(processId),
    callback,
    orderBy("timestamp", "asc"),
  );
}

export function subscribeToMessagesByPhase(
  processId: string,
  phase: ChatPhase,
  callback: (messages: (ChatMessage & { id: string })[]) => void,
) {
  return subscribeToCollection<ChatMessage>(
    messagesPath(processId),
    callback,
    where("phase", "==", phase),
    orderBy("timestamp", "asc"),
  );
}
