/**
 * MCP Server Registry — Firestore CRUD for MCP-serverdefinisjoner.
 *
 * Collection: mcpServers/{serverId}
 */

import {
  addDocument,
  getDocument,
  getCollection,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  orderBy,
} from "@/lib/firebase/firestore";

export type MCPTransport = "stdio" | "sse" | "streamable-http";

export type MCPServerStatus = "active" | "inactive" | "error";

export type MCPServerDefinition = {
  name: string;
  category: string;
  description: string;
  url: string;
  transport: MCPTransport;
  tools: MCPServerTool[];
  authType: "none" | "api-key" | "oauth" | "bearer";
  status: MCPServerStatus;
  icon?: string;
};

export type MCPServerTool = {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
};

const COLLECTION = "mcpServers";

// ─── CRUD ───────────────────────────────────────────────────

export async function createMCPServer(data: MCPServerDefinition) {
  return addDocument(COLLECTION, data);
}

export async function getMCPServer(id: string) {
  return getDocument<MCPServerDefinition>(COLLECTION, id);
}

export async function listMCPServers() {
  return getCollection<MCPServerDefinition>(
    COLLECTION,
    orderBy("category"),
    orderBy("name")
  );
}

export async function listMCPServersByCategory(category: string) {
  const { where } = await import("@/lib/firebase/firestore");
  return getCollection<MCPServerDefinition>(
    COLLECTION,
    where("category", "==", category),
    orderBy("name")
  );
}

export async function updateMCPServer(
  id: string,
  data: Partial<MCPServerDefinition>
) {
  return updateDocument(COLLECTION, id, data);
}

export async function deleteMCPServer(id: string) {
  return deleteDocument(COLLECTION, id);
}

// ─── Sanntidslytter ─────────────────────────────────────────

export function subscribeToMCPServers(
  callback: (servers: (MCPServerDefinition & { id: string })[]) => void
) {
  return subscribeToCollection<MCPServerDefinition>(
    COLLECTION,
    callback,
    orderBy("category"),
    orderBy("name")
  );
}

// ─── Seed-data for forhåndsdefinerte MCP-servere ────────────

export const SEED_MCP_SERVERS: MCPServerDefinition[] = [
  {
    name: "Xero MCP",
    category: "Regnskap",
    description: "Xero regnskapssystem — fakturering, kontering, rapporter",
    url: "https://mcp.xero.com",
    transport: "streamable-http",
    tools: [
      { name: "createInvoice", description: "Opprett utgående faktura", parameters: { customer: { type: "string", description: "Kundenavn", required: true } } },
      { name: "getAccounts", description: "Hent kontoliste", parameters: {} },
    ],
    authType: "oauth",
    status: "active",
  },
  {
    name: "Tripletex API",
    category: "Regnskap",
    description: "Tripletex ERP — norsk regnskapssystem",
    url: "https://tripletex.no/v2",
    transport: "streamable-http",
    tools: [
      { name: "createVoucher", description: "Opprett bilag", parameters: { date: { type: "string", description: "Bilagsdato", required: true } } },
      { name: "getAccounts", description: "Hent kontoplan (NS 4102)", parameters: {} },
    ],
    authType: "bearer",
    status: "active",
  },
  {
    name: "Stripe MCP",
    category: "Betaling",
    description: "Stripe betalingsplattform — kunder, fakturaer, abonnementer",
    url: "https://mcp.stripe.com",
    transport: "streamable-http",
    tools: [
      { name: "createCustomer", description: "Opprett kunde", parameters: { email: { type: "string", description: "E-postadresse", required: true } } },
      { name: "createInvoice", description: "Opprett faktura", parameters: {} },
    ],
    authType: "api-key",
    status: "active",
  },
  {
    name: "Vipps MobilePay",
    category: "Betaling",
    description: "Vipps MobilePay — norsk mobilbetaling",
    url: "https://api.vipps.no",
    transport: "streamable-http",
    tools: [
      { name: "initiatePayment", description: "Start betaling", parameters: { amount: { type: "number", description: "Beløp i øre", required: true } } },
    ],
    authType: "oauth",
    status: "active",
  },
  {
    name: "Brønnøysundregistrene",
    category: "Norske registre",
    description: "Oppslag i Enhetsregisteret og Foretaksregisteret",
    url: "https://data.brreg.no",
    transport: "streamable-http",
    tools: [
      { name: "lookupOrg", description: "Slå opp organisasjonsnummer", parameters: { orgNumber: { type: "string", description: "9-sifret org.nr.", required: true } } },
    ],
    authType: "none",
    status: "active",
  },
  {
    name: "DNB Open Banking",
    category: "Bank",
    description: "DNB bankintegrasjon — kontoer, transaksjoner, betalinger",
    url: "https://developer.dnb.no",
    transport: "streamable-http",
    tools: [
      { name: "getAccounts", description: "Hent bankkontoer", parameters: {} },
      { name: "getTransactions", description: "Hent transaksjoner", parameters: { accountId: { type: "string", description: "Konto-ID", required: true } } },
    ],
    authType: "oauth",
    status: "active",
  },
  {
    name: "EHF/PEPPOL",
    category: "Norske registre",
    description: "Elektronisk fakturering via PEPPOL-nettverket",
    url: "https://peppol.eu",
    transport: "streamable-http",
    tools: [
      { name: "sendInvoice", description: "Send EHF-faktura", parameters: { recipientId: { type: "string", description: "PEPPOL-ID", required: true } } },
    ],
    authType: "api-key",
    status: "active",
  },
];
