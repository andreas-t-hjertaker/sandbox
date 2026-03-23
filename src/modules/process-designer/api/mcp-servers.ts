import {
  getCollection,
  getDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  subscribeToDocument,
} from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import type { MCPServer } from "../types";

// ─── Collection path ───────────────────────────────────────────────

const COLLECTION = "mcpServers";

// ─── Read ──────────────────────────────────────────────────────────

export async function getMCPServers() {
  return getCollection<MCPServer>(COLLECTION, orderBy("name", "asc"));
}

export async function getMCPServer(serverId: string) {
  return getDocument<MCPServer>(COLLECTION, serverId);
}

export async function getMCPServersByCategory(category: string) {
  return getCollection<MCPServer>(
    COLLECTION,
    where("category", "==", category),
    orderBy("name", "asc"),
  );
}

export async function getActiveMCPServers() {
  return getCollection<MCPServer>(
    COLLECTION,
    where("status", "==", "active"),
    orderBy("name", "asc"),
  );
}

// ─── Write ─────────────────────────────────────────────────────────

export type CreateMCPServerInput = Omit<MCPServer, "id">;

export async function createMCPServer(data: CreateMCPServerInput) {
  const ref = await addDocument(COLLECTION, data);
  return ref.id;
}

export async function updateMCPServer(
  serverId: string,
  data: Partial<
    Pick<
      MCPServer,
      "name" | "description" | "url" | "transport" | "tools" | "authType" | "status" | "icon" | "category"
    >
  >,
) {
  return updateDocument(COLLECTION, serverId, data);
}

export async function deleteMCPServer(serverId: string) {
  return deleteDocument(COLLECTION, serverId);
}

export async function setMCPServerStatus(
  serverId: string,
  status: MCPServer["status"],
) {
  return updateDocument(COLLECTION, serverId, { status });
}

// ─── Real-time listeners ───────────────────────────────────────────

export function subscribeToMCPServers(
  callback: (servers: (MCPServer & { id: string })[]) => void,
) {
  return subscribeToCollection<MCPServer>(
    COLLECTION,
    callback,
    orderBy("name", "asc"),
  );
}

export function subscribeToMCPServer(
  serverId: string,
  callback: (server: (MCPServer & { id: string }) | null) => void,
) {
  return subscribeToDocument<MCPServer>(COLLECTION, serverId, callback);
}

// ─── Seed data ─────────────────────────────────────────────────────

export async function seedMCPServers() {
  const servers: CreateMCPServerInput[] = [
    {
      name: "Slack",
      category: "kommunikasjon",
      description: "Send og les meldinger i Slack-kanaler.",
      url: "https://mcp.slack.example.com",
      transport: "streamable-http",
      tools: [
        {
          name: "send-message",
          description: "Send en melding til en Slack-kanal",
          inputSchema: {
            type: "object",
            properties: {
              channel: { type: "string" },
              message: { type: "string" },
            },
          },
        },
        {
          name: "read-channel",
          description: "Les meldinger fra en Slack-kanal",
          inputSchema: {
            type: "object",
            properties: {
              channel: { type: "string" },
              limit: { type: "number" },
            },
          },
        },
      ],
      authType: "oauth",
      status: "active",
      icon: "slack",
    },
    {
      name: "Google Sheets",
      category: "data",
      description: "Les og skriv til Google Sheets-regneark.",
      url: "https://mcp.sheets.example.com",
      transport: "streamable-http",
      tools: [
        {
          name: "read-sheet",
          description: "Les data fra et regneark",
          inputSchema: {
            type: "object",
            properties: {
              spreadsheetId: { type: "string" },
              range: { type: "string" },
            },
          },
        },
        {
          name: "write-sheet",
          description: "Skriv data til et regneark",
          inputSchema: {
            type: "object",
            properties: {
              spreadsheetId: { type: "string" },
              range: { type: "string" },
              values: { type: "array" },
            },
          },
        },
      ],
      authType: "oauth",
      status: "active",
      icon: "sheets",
    },
    {
      name: "PostgreSQL",
      category: "database",
      description: "Kjør spørringer mot PostgreSQL-databaser.",
      url: "https://mcp.postgres.example.com",
      transport: "stdio",
      tools: [
        {
          name: "query",
          description: "Kjør en SQL-spørring",
          inputSchema: {
            type: "object",
            properties: {
              sql: { type: "string" },
              params: { type: "array" },
            },
          },
        },
      ],
      authType: "bearer",
      status: "active",
      icon: "database",
    },
  ];

  const ids: string[] = [];
  for (const server of servers) {
    const id = await createMCPServer(server);
    ids.push(id);
  }
  return ids;
}
