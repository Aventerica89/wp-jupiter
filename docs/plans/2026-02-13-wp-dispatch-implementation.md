# WP Dispatch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create WP Dispatch by forking wp-jupiter and porting bricks-cc's client management, Basecamp integration, AI chat, and Bricks editing features into it.

**Architecture:** Fork wp-jupiter (Next.js 16 + Turso/Drizzle + shadcn/ui) as the base. Port 6 libraries and 4 feature modules from bricks-cc. Single unified Turso database with ~28 tables. PIN auth (already in wp-jupiter as ADMIN_PASSWORD).

**Tech Stack:** Next.js 16, React 19, Turso + Drizzle ORM, shadcn/ui, Tailwind v4, Anthropic SDK, Zod

**Source repos:**
- wp-jupiter: `~/.21st/repos/Aventerica89/wp-jupiter/` (base)
- bricks-cc: `~/bricks-cc/` (feature source)

---

## Task 1: Create WP Dispatch Repo

**Files:**
- Create: `~/wp-dispatch/` (new repo from wp-jupiter)

**Step 1: Clone wp-jupiter as wp-dispatch**

```bash
cp -r ~/.21st/repos/Aventerica89/wp-jupiter ~/wp-dispatch
cd ~/wp-dispatch
rm -rf .git
git init
```

**Step 2: Create GitHub repo and set remote**

```bash
cd ~/wp-dispatch
gh repo create Aventerica89/wp-dispatch --private --source=. --push
```

**Step 3: Verify build works**

```bash
cd ~/wp-dispatch
npm install
npm run build
```

Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
cd ~/wp-dispatch
git add -A
git commit -m "chore: init wp-dispatch from wp-jupiter base"
```

---

## Task 2: Rebrand to WP Dispatch

**Files:**
- Modify: `~/wp-dispatch/package.json` (name field)
- Modify: `~/wp-dispatch/src/app/layout.tsx` (title metadata)
- Modify: `~/wp-dispatch/src/app/manifest.ts` (PWA name)
- Modify: `~/wp-dispatch/src/components/logo.tsx` (brand text)
- Modify: `~/wp-dispatch/src/components/app-sidebar.tsx` (sidebar title)
- Modify: `~/wp-dispatch/CLAUDE.md` (project description)

**Step 1: Update package.json name**

Change `"name": "wp-jupiter"` to `"name": "wp-dispatch"`.

**Step 2: Update layout.tsx metadata**

Replace all "WP Jupiter" references with "WP Dispatch" in the root layout's metadata export.

**Step 3: Update manifest.ts**

Change `name` and `short_name` to "WP Dispatch".

**Step 4: Update logo and sidebar components**

Replace "WP Jupiter" text with "WP Dispatch" in `logo.tsx` and `app-sidebar.tsx`.

**Step 5: Update CLAUDE.md header**

Change first line to: `# WP Dispatch - WordPress Site Management + Client Portal`

**Step 6: Global search for remaining references**

```bash
cd ~/wp-dispatch
grep -r "wp-jupiter" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" -l
```

Replace any remaining "wp-jupiter" references with "wp-dispatch" (except in git history comments).

**Step 7: Update auth cookie name**

In `src/lib/auth.ts`, change `SESSION_COOKIE` from `"wp-jupiter-session"` to `"wp-dispatch-session"`.

**Step 8: Verify build**

```bash
cd ~/wp-dispatch
npm run build
```

Expected: PASS

**Step 9: Commit**

```bash
git add -A
git commit -m "chore: rebrand wp-jupiter to wp-dispatch"
```

---

## Task 3: Add New Dependencies

**Files:**
- Modify: `~/wp-dispatch/package.json`

**Step 1: Install Anthropic SDK**

```bash
cd ~/wp-dispatch
npm install @anthropic-ai/sdk
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: PASS

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add anthropic sdk dependency"
```

---

## Task 4: Port Type Definitions

**Files:**
- Create: `~/wp-dispatch/src/types/basecamp.ts`
- Create: `~/wp-dispatch/src/types/bricks.ts`
- Create: `~/wp-dispatch/src/types/chat.ts`

**Step 1: Copy type files from bricks-cc**

Copy these files verbatim from `~/bricks-cc/src/types/`:
- `basecamp.ts` (170 lines — Basecamp API response types)
- `bricks.ts` (115 lines — Bricks element structures)
- `chat.ts` (108 lines — Chat message/context types)

These are pure type definitions with no imports from bricks-cc internals — they copy cleanly.

**Step 2: Verify TypeScript compiles**

```bash
cd ~/wp-dispatch
npx tsc --noEmit
```

Expected: PASS (types are standalone, no external deps)

**Step 3: Commit**

```bash
git add src/types/
git commit -m "feat: add basecamp, bricks, and chat type definitions"
```

---

## Task 5: Extend Database Schema

**Files:**
- Modify: `~/wp-dispatch/src/lib/db/schema.ts`

**Step 1: Write failing test for new tables**

Create `~/wp-dispatch/src/lib/db/schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import * as schema from "./schema";

describe("Schema: new dispatch tables", () => {
  it("exports clients table", () => {
    expect(schema.clients).toBeDefined();
  });

  it("exports chatMessages table", () => {
    expect(schema.chatMessages).toBeDefined();
  });

  it("exports clientFeedback table", () => {
    expect(schema.clientFeedback).toBeDefined();
  });

  it("exports bricksPages table", () => {
    expect(schema.bricksPages).toBeDefined();
  });

  it("exports basecampSync table", () => {
    expect(schema.basecampSync).toBeDefined();
  });

  it("sites table has clientId column", () => {
    expect(schema.sites.clientId).toBeDefined();
  });

  it("sites table has bricksApiKey column", () => {
    expect(schema.sites.bricksApiKey).toBeDefined();
  });

  it("sites table has basecampProjectId column", () => {
    expect(schema.sites.basecampProjectId).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd ~/wp-dispatch
npx vitest run src/lib/db/schema.test.ts
```

Expected: FAIL — properties don't exist yet

**Step 3: Add new columns to sites table**

In `schema.ts`, add these columns to the `sites` table definition (after `updatedAt`):

```typescript
  // Client + Bricks + Basecamp integration
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  bricksApiKey: text("bricks_api_key"), // Encrypted
  basecampProjectId: text("basecamp_project_id"),
```

**Step 4: Add clients table**

After the existing `projects` table definition:

```typescript
// Clients (agencies, freelancers, site owners)
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  company: text("company"),
  avatarUrl: text("avatar_url"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});
```

**Step 5: Add chatMessages table**

```typescript
// AI chat message history
export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "cascade" }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "cascade" }),
  userMessage: text("user_message").notNull(),
  claudeResponse: text("claude_response"),
  metadata: text("metadata"), // JSON: tokens, execution time, actions
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});
```

**Step 6: Add clientFeedback table**

```typescript
// Client feedback (bugs, features, general) — syncs to Basecamp
export const clientFeedback = sqliteTable("client_feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "cascade" }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "cascade" }),
  feedbackType: text("feedback_type", { enum: ["bug", "feature", "general"] }).notNull(),
  message: text("message").notNull(),
  basecampTodoId: text("basecamp_todo_id"),
  status: text("status", { enum: ["new", "in_progress", "resolved"] }).default("new"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});
```

**Step 7: Add bricksPages table**

```typescript
// Cached Bricks page structures
export const bricksPages = sqliteTable("bricks_pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  pageId: integer("page_id").notNull(),
  title: text("title"),
  structure: text("structure"), // JSON: full bricks_data array
  lastFetch: text("last_fetch"),
  editableByClient: integer("editable_by_client", { mode: "boolean" }).default(false),
});
```

**Step 8: Add basecampSync table**

```typescript
// Basecamp OAuth + sync metadata per site
export const basecampSync = sqliteTable("basecamp_sync", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "cascade" }),
  basecampAccountId: text("basecamp_account_id"),
  projectId: text("project_id"),
  apiToken: text("api_token"), // Encrypted
  syncStatus: text("sync_status", { enum: ["active", "paused", "error"] }).default("active"),
  lastSync: text("last_sync"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});
```

**Step 9: Add relations for new tables**

```typescript
export const clientsRelations = relations(clients, ({ many }) => ({
  sites: many(sites),
  chatMessages: many(chatMessages),
  feedback: many(clientFeedback),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  client: one(clients, { fields: [chatMessages.clientId], references: [clients.id] }),
  site: one(sites, { fields: [chatMessages.siteId], references: [sites.id] }),
}));

export const clientFeedbackRelations = relations(clientFeedback, ({ one }) => ({
  client: one(clients, { fields: [clientFeedback.clientId], references: [clients.id] }),
  site: one(sites, { fields: [clientFeedback.siteId], references: [sites.id] }),
}));

export const bricksPagesRelations = relations(bricksPages, ({ one }) => ({
  site: one(sites, { fields: [bricksPages.siteId], references: [sites.id] }),
}));

export const basecampSyncRelations = relations(basecampSync, ({ one }) => ({
  site: one(sites, { fields: [basecampSync.siteId], references: [sites.id] }),
}));
```

Also update the existing `sitesRelations` to add:

```typescript
  client: one(clients, { fields: [sites.clientId], references: [clients.id] }),
  chatMessages: many(chatMessages),
  feedback: many(clientFeedback),
  bricksPages: many(bricksPages),
  basecampSync: many(basecampSync),
```

**Step 10: Add type exports**

```typescript
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type ChatMessageRecord = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type ClientFeedbackRecord = typeof clientFeedback.$inferSelect;
export type BricksPageRecord = typeof bricksPages.$inferSelect;
export type BasecampSyncRecord = typeof basecampSync.$inferSelect;
```

**Step 11: Run test to verify it passes**

```bash
npx vitest run src/lib/db/schema.test.ts
```

Expected: PASS

**Step 12: Push schema to database**

```bash
npm run db:push
```

Expected: Schema applied successfully

**Step 13: Commit**

```bash
git add src/lib/db/schema.ts src/lib/db/schema.test.ts
git commit -m "feat(db): add clients, chat, feedback, bricks, basecamp tables"
```

---

## Task 6: Port Crypto + Encryption Utilities

**Files:**
- Create: `~/wp-dispatch/src/lib/crypto.ts`
- Create: `~/wp-dispatch/src/lib/secure-keys.ts`
- Create: `~/wp-dispatch/src/lib/crypto.test.ts`

**Step 1: Write failing test**

Create `~/wp-dispatch/src/lib/crypto.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { encrypt, decrypt, isEncrypted, safeEncrypt, safeDecrypt } from "./crypto";

describe("crypto", () => {
  it("encrypts and decrypts a string", () => {
    const original = "my-secret-api-key";
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  it("detects encrypted strings", () => {
    const encrypted = encrypt("test");
    expect(isEncrypted(encrypted)).toBe(true);
    expect(isEncrypted("plain-text")).toBe(false);
  });

  it("safeEncrypt skips already encrypted data", () => {
    const encrypted = encrypt("test");
    expect(safeEncrypt(encrypted)).toBe(encrypted);
  });

  it("safeDecrypt returns plain text as-is", () => {
    expect(safeDecrypt("plain-text")).toBe("plain-text");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/crypto.test.ts
```

Expected: FAIL — module not found

**Step 3: Copy crypto.ts from bricks-cc**

Copy `~/bricks-cc/src/lib/crypto.ts` verbatim to `~/wp-dispatch/src/lib/crypto.ts`.

This file uses Node.js `crypto` module (built-in) and reads `ENCRYPTION_KEY` from env. No external deps.

**Step 4: Copy secure-keys.ts from bricks-cc**

Copy `~/bricks-cc/src/lib/secure-keys.ts` verbatim to `~/wp-dispatch/src/lib/secure-keys.ts`.

Update import path if needed: `import { encrypt, decrypt, safeEncrypt, safeDecrypt } from "./crypto";`

**Step 5: Run test to verify it passes**

```bash
npx vitest run src/lib/crypto.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/crypto.ts src/lib/secure-keys.ts src/lib/crypto.test.ts
git commit -m "feat: port AES-256-GCM encryption utilities from bricks-cc"
```

---

## Task 7: Port Rate Limiter

**Files:**
- Create: `~/wp-dispatch/src/lib/rate-limit.ts`
- Create: `~/wp-dispatch/src/lib/rate-limit.test.ts`

**Step 1: Write failing test**

Create `~/wp-dispatch/src/lib/rate-limit.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import rateLimiter, { RATE_LIMITS, applyRateLimit, getClientIp } from "./rate-limit";

describe("rate-limit", () => {
  it("allows requests within limit", () => {
    rateLimiter.reset("test-ip");
    const result = rateLimiter.check("test-ip", 5, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding limit", () => {
    rateLimiter.reset("test-ip-2");
    for (let i = 0; i < 3; i++) {
      rateLimiter.check("test-ip-2", 3, 60000);
    }
    const result = rateLimiter.check("test-ip-2", 3, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("exports RATE_LIMITS config", () => {
    expect(RATE_LIMITS.chat.limit).toBe(10);
    expect(RATE_LIMITS.feedback.limit).toBe(5);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/rate-limit.test.ts
```

Expected: FAIL

**Step 3: Copy rate-limit.ts from bricks-cc**

Copy `~/bricks-cc/src/lib/rate-limit.ts` verbatim. No external deps — pure in-memory implementation.

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/rate-limit.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/rate-limit.ts src/lib/rate-limit.test.ts
git commit -m "feat: port in-memory rate limiter from bricks-cc"
```

---

## Task 8: Port BasecampClient

**Files:**
- Create: `~/wp-dispatch/src/lib/basecamp.ts`

**Step 1: Copy basecamp.ts from bricks-cc**

Copy `~/bricks-cc/src/lib/basecamp.ts` to `~/wp-dispatch/src/lib/basecamp.ts`.

**Step 2: Fix imports**

The file imports from `@/types/basecamp` — this already exists from Task 4.

The `createBasecampClientFromSettings()` function imports from `@/db/schema` — update this to reference the new `basecampSync` table instead of `platformSettings`:

Replace the `createBasecampClientFromSettings()` function body to query from `basecampSync` table instead of `platformSettings`. For now, keep the env-var fallback version (`createBasecampClient()`) as the primary path. The settings-based version can be adapted once the Basecamp settings UI is built.

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/basecamp.ts
git commit -m "feat: port BasecampClient from bricks-cc"
```

---

## Task 9: Port BricksClient

**Files:**
- Create: `~/wp-dispatch/src/lib/bricks.ts`

**Step 1: Copy bricks.ts from bricks-cc**

Copy `~/bricks-cc/src/lib/bricks.ts` to `~/wp-dispatch/src/lib/bricks.ts`.

**Step 2: Verify imports**

The file imports from `@/types/bricks` — already exists from Task 4. No other external deps.

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/bricks.ts
git commit -m "feat: port BricksClient from bricks-cc"
```

---

## Task 10: Port Claude Integration

**Files:**
- Create: `~/wp-dispatch/src/lib/claude-chat.ts`

**Step 1: Copy claude-cli.ts from bricks-cc as claude-chat.ts**

Copy `~/bricks-cc/src/lib/claude-cli.ts` to `~/wp-dispatch/src/lib/claude-chat.ts`.

Rename to `claude-chat.ts` since this isn't a CLI wrapper — it's the chat API integration.

**Step 2: Verify imports**

Imports `@anthropic-ai/sdk` (installed in Task 3) and `@/types/chat` (exists from Task 4).

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/claude-chat.ts
git commit -m "feat: port Anthropic chat integration from bricks-cc"
```

---

## Task 11: Port Context Builder

**Files:**
- Create: `~/wp-dispatch/src/lib/context.ts`

**Step 1: Copy context.ts from bricks-cc**

Copy `~/bricks-cc/src/lib/context.ts` to `~/wp-dispatch/src/lib/context.ts`.

**Step 2: Adapt imports to unified schema**

The original imports `chatMessages` and `clientSites` from bricks-cc's schema. Update to use the wp-dispatch unified schema:

- Replace `import { chatMessages, clientSites } from "@/db/schema"` with `import { chatMessages, sites } from "@/lib/db/schema"`
- Update `getClientSiteInfo()` to query from `sites` table (with `clientId` column) instead of `clientSites`
- Update field names: `clientSites.basecampProjectId` becomes `sites.basecampProjectId`
- Change `clientSites.id` to `sites.id`, `clientSites.clientId` to `sites.clientId`
- Update `import { db } from "./db"` path

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/context.ts
git commit -m "feat: port context builder, adapted for unified schema"
```

---

## Task 12: Build Clients API

**Files:**
- Create: `~/wp-dispatch/src/app/api/clients/route.ts`
- Create: `~/wp-dispatch/src/app/api/clients/[id]/route.ts`
- Create: `~/wp-dispatch/src/app/api/clients/[id]/sites/route.ts`

**Step 1: Create clients list + create endpoint**

`src/app/api/clients/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  company: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export async function GET() {
  const allClients = await db
    .select()
    .from(clients)
    .orderBy(desc(clients.createdAt));
  return NextResponse.json(allClients);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createClientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(clients)
    .values(parsed.data)
    .returning();

  return NextResponse.json(created, { status: 201 });
}
```

**Step 2: Create single client endpoint**

`src/app/api/clients/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, parseInt(id)))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(clients)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(clients.id, parseInt(id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(clients).where(eq(clients.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
```

**Step 3: Create client sites endpoint**

`src/app/api/clients/[id]/sites/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clientSites = await db
    .select()
    .from(sites)
    .where(eq(sites.clientId, parseInt(id)));

  return NextResponse.json(clientSites);
}
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/clients/
git commit -m "feat(api): add clients CRUD endpoints"
```

---

## Task 13: Build Chat API

**Files:**
- Create: `~/wp-dispatch/src/app/api/chat/route.ts`

**Step 1: Create chat endpoint**

`src/app/api/chat/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatMessages } from "@/lib/db/schema";
import { processWithClaude, buildContextString } from "@/lib/claude-chat";
import { buildContext } from "@/lib/context";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const chatRequestSchema = z.object({
  clientId: z.string().or(z.number()),
  siteId: z.string().or(z.number()),
  message: z.string().min(1),
  context: z.object({
    currentPageId: z.number().optional(),
    basecampProjectId: z.number().optional(),
  }).optional(),
});

const SYSTEM_PROMPT = [
  "You are a helpful WordPress site management assistant for WP Dispatch.",
  "You help clients manage their WordPress sites, track Basecamp projects,",
  "and edit Bricks Builder pages. Be concise and actionable.",
  "When discussing todos or tasks, reference Basecamp data from the context.",
  "When discussing page edits, reference Bricks elements from the context.",
].join(" ");

export async function POST(request: Request) {
  // Rate limit
  const rateCheck = applyRateLimit(request, RATE_LIMITS.chat);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetTime - Date.now()) / 1000)) } }
    );
  }

  const body = await request.json();
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId, siteId, message, context: reqContext } = parsed.data;

  // Build rich context
  const chatContext = await buildContext({
    clientId: String(clientId),
    siteId: String(siteId),
    basecampProjectId: reqContext?.basecampProjectId,
    currentPageId: reqContext?.currentPageId,
  });

  const contextString = buildContextString(chatContext);

  // Call Claude
  const result = await processWithClaude({
    userMessage: message,
    context: contextString,
    systemPrompt: SYSTEM_PROMPT,
    siteId: String(siteId),
  });

  // Persist message
  await db.insert(chatMessages).values({
    clientId: Number(clientId),
    siteId: Number(siteId),
    userMessage: message,
    claudeResponse: result.response,
    metadata: JSON.stringify({
      tokensUsed: result.tokensUsed,
      executionTime: result.executionTime,
    }),
  });

  return NextResponse.json({
    response: result.response,
    metadata: {
      tokensUsed: result.tokensUsed,
      executionTime: result.executionTime,
    },
  });
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/app/api/chat/
git commit -m "feat(api): add AI chat endpoint with context + rate limiting"
```

---

## Task 14: Build Basecamp API

**Files:**
- Create: `~/wp-dispatch/src/app/api/basecamp/route.ts`
- Create: `~/wp-dispatch/src/app/api/basecamp/sync/route.ts`
- Create: `~/wp-dispatch/src/app/api/basecamp/webhooks/route.ts`

**Step 1: Create Basecamp projects endpoint**

`src/app/api/basecamp/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createBasecampClient } from "@/lib/basecamp";

export async function GET() {
  try {
    const client = createBasecampClient();
    const projects = await client.getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Basecamp data" },
      { status: 500 }
    );
  }
}
```

**Step 2: Create sync endpoint**

`src/app/api/basecamp/sync/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createBasecampClient } from "@/lib/basecamp";
import { z } from "zod";

const syncSchema = z.object({
  action: z.enum(["create_todo", "update_todo", "fetch_projects"]),
  projectId: z.number(),
  todoListId: z.number().optional(),
  payload: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = syncSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const client = createBasecampClient();
    const { action, projectId, todoListId, payload } = parsed.data;

    if (action === "fetch_projects") {
      const summary = await client.getProjectSummary(projectId);
      return NextResponse.json({ success: true, data: summary });
    }

    if (action === "create_todo" && todoListId) {
      const todo = await client.createTodo(
        projectId,
        todoListId,
        (payload?.content as string) || "",
        { description: payload?.description as string }
      );
      return NextResponse.json({ success: true, data: todo });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
```

**Step 3: Create webhook endpoint (stub)**

`src/app/api/basecamp/webhooks/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  console.log("[Basecamp Webhook]", JSON.stringify(body).substring(0, 200));

  // TODO: Process webhook events (todo completed, message posted, etc.)

  return NextResponse.json({ received: true });
}
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/basecamp/
git commit -m "feat(api): add basecamp projects, sync, and webhook endpoints"
```

---

## Task 15: Build Bricks API

**Files:**
- Create: `~/wp-dispatch/src/app/api/bricks/route.ts`
- Create: `~/wp-dispatch/src/app/api/bricks/edit/route.ts`

**Step 1: Create Bricks proxy endpoint**

`src/app/api/bricks/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BricksClient } from "@/lib/bricks";
import { decryptBricksApiKey } from "@/lib/secure-keys";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");

  if (!siteId) {
    return NextResponse.json({ error: "siteId required" }, { status: 400 });
  }

  const [site] = await db
    .select()
    .from(sites)
    .where(eq(sites.id, parseInt(siteId)))
    .limit(1);

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const apiKey = site.bricksApiKey ? decryptBricksApiKey(site.bricksApiKey) : null;

  const client = new BricksClient({
    siteUrl: site.url,
    apiKey: apiKey || "",
    wordpressUser: site.apiUsername,
    applicationPassword: site.apiPassword,
  });

  try {
    const pages = await client.getPages();
    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch pages" },
      { status: 500 }
    );
  }
}
```

**Step 2: Create Bricks edit endpoint**

`src/app/api/bricks/edit/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BricksClient } from "@/lib/bricks";
import { decryptBricksApiKey } from "@/lib/secure-keys";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const editSchema = z.object({
  siteId: z.number(),
  pageId: z.number(),
  edits: z.array(z.object({
    elementId: z.string(),
    property: z.string(),
    value: z.unknown(),
  })),
});

export async function POST(request: Request) {
  const rateCheck = applyRateLimit(request, RATE_LIMITS.bricksEdit);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = editSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [site] = await db
    .select()
    .from(sites)
    .where(eq(sites.id, parsed.data.siteId))
    .limit(1);

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const apiKey = site.bricksApiKey ? decryptBricksApiKey(site.bricksApiKey) : null;

  const client = new BricksClient({
    siteUrl: site.url,
    apiKey: apiKey || "",
    wordpressUser: site.apiUsername,
    applicationPassword: site.apiPassword,
  });

  const result = await client.applyEdits(parsed.data);
  return NextResponse.json(result);
}
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/app/api/bricks/
git commit -m "feat(api): add bricks page list and edit endpoints"
```

---

## Task 16: Build Feedback API

**Files:**
- Create: `~/wp-dispatch/src/app/api/feedback/route.ts`

**Step 1: Create feedback endpoint**

`src/app/api/feedback/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientFeedback } from "@/lib/db/schema";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const feedbackSchema = z.object({
  clientId: z.number(),
  siteId: z.number(),
  feedbackType: z.enum(["bug", "feature", "general"]),
  message: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  const rateCheck = applyRateLimit(request, RATE_LIMITS.feedback);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(clientFeedback)
    .values(parsed.data)
    .returning();

  // TODO: Optionally sync to Basecamp as a todo
  // const basecampClient = createBasecampClient();
  // await basecampClient.createTodo(projectId, todoListId, parsed.data.message);

  return NextResponse.json(created, { status: 201 });
}
```

**Step 2: Commit**

```bash
git add src/app/api/feedback/
git commit -m "feat(api): add client feedback endpoint"
```

---

## Task 17: Build Clients UI Page

**Files:**
- Create: `~/wp-dispatch/src/app/(dashboard)/clients/page.tsx`
- Create: `~/wp-dispatch/src/app/(dashboard)/clients/new/page.tsx`
- Create: `~/wp-dispatch/src/app/(dashboard)/clients/[id]/page.tsx`

**Step 1: Create clients list page**

Build a server component that fetches from `/api/clients` and renders using the existing `DataTable` component pattern from the sites page. Include columns: Name, Company, Email, Sites count, Status, Created date.

Reference `~/wp-dispatch/src/app/(dashboard)/sites/` for the page pattern.
Reference `~/wp-dispatch/src/components/data-table.tsx` for the table component.

**Step 2: Create new client form page**

Simple form with shadcn Input, Button, Card components. Fields: name (required), email, company. Posts to `/api/clients`. Redirects to `/clients/[id]` on success.

**Step 3: Create client detail page**

Tabbed layout (using shadcn Tabs) with:
- **Sites tab**: Lists sites where `clientId` matches. Uses existing site card pattern.
- **Chat tab**: Placeholder for chat interface (Task 18).
- **Feedback tab**: List of feedback entries + submission form.
- **Settings tab**: Edit client name/email/company, Basecamp project link.

**Step 4: Update sidebar navigation**

In `src/components/app-sidebar.tsx`, add "Clients" to the nav items:

```typescript
{ title: "Clients", url: "/clients", icon: Users },
```

Add `Users` to the lucide-react imports.

**Step 5: Verify build**

```bash
npm run build
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/clients/ src/components/app-sidebar.tsx
git commit -m "feat(ui): add clients list, detail, and new client pages"
```

---

## Task 18: Build Chat Interface Component

**Files:**
- Create: `~/wp-dispatch/src/components/chat-interface.tsx`

**Step 1: Build chat component using shadcn primitives**

Use shadcn Card, Input, Button, ScrollArea, Avatar. The component should:
- Accept `clientId` and `siteId` props
- Maintain local message state with `useState`
- POST to `/api/chat` on send
- Display messages in a scrollable area
- Show loading indicator during API call
- Auto-scroll to latest message

This is a client component (`"use client"`).

Reference bricks-cc's `~/bricks-cc/src/components/ChatInterface.tsx` for the logic pattern, but rebuild UI with shadcn components.

**Step 2: Integrate into client detail page**

Import `ChatInterface` into the client detail page's "Chat" tab.

**Step 3: Verify build**

```bash
npm run build
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/components/chat-interface.tsx src/app/\(dashboard\)/clients/
git commit -m "feat(ui): add AI chat interface component"
```

---

## Task 19: Add Settings Pages

**Files:**
- Create: `~/wp-dispatch/src/app/(dashboard)/settings/basecamp/page.tsx`
- Create: `~/wp-dispatch/src/app/(dashboard)/settings/ai/page.tsx`

**Step 1: Create Basecamp settings page**

Form with fields: Basecamp Account ID, OAuth Token (masked input). Save to env or basecampSync table.

**Step 2: Create AI settings page**

Form with field: Anthropic API Key (masked input). Show connection status indicator.

**Step 3: Update settings navigation**

Add "Basecamp" and "AI" links to the settings page navigation.

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/settings/
git commit -m "feat(ui): add basecamp and AI settings pages"
```

---

## Task 20: Update Environment Variables

**Files:**
- Modify: `~/wp-dispatch/.env.example`
- Create: `~/wp-dispatch/.env.local.tpl` (if using 1Password)

**Step 1: Update .env.example**

Add to `.env.example`:

```
# AI Chat (Anthropic)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Basecamp Integration
BASECAMP_ACCOUNT_ID=your-basecamp-account-id
BASECAMP_OAUTH_TOKEN=your-basecamp-oauth-token
BASECAMP_USER_AGENT=WP Dispatch (contact@example.com)

# Encryption (for Bricks API keys + Basecamp tokens)
ENCRYPTION_KEY=generate-with-openssl-rand-hex-32

# Chat Widget CORS
WIDGET_ALLOWED_ORIGINS=https://client-site-1.com,https://client-site-2.com
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: update .env.example with new integration vars"
```

---

## Task 21: Run Full Test Suite

**Files:**
- All test files

**Step 1: Run all tests**

```bash
cd ~/wp-dispatch
npm run test:run
```

**Step 2: Fix any failures**

Address test failures from schema changes (existing tests may reference old schema shape).

**Step 3: Verify coverage**

```bash
npm run test:coverage
```

Target: 80%+ on new code.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "test: fix test suite after schema + feature additions"
```

---

## Task 22: Deploy to Vercel

**Step 1: Create Vercel project**

```bash
cd ~/wp-dispatch
npx vercel --yes
```

**Step 2: Set environment variables**

Use 1Password MCP or Vercel dashboard to set:
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- `ADMIN_PASSWORD` (PIN)
- `AUTH_SECRET`
- `ANTHROPIC_API_KEY`
- `BASECAMP_ACCOUNT_ID`, `BASECAMP_OAUTH_TOKEN`
- `ENCRYPTION_KEY`

**Step 3: Deploy**

```bash
npx vercel --prod
```

**Step 4: Verify live site**

Open the deployment URL and verify:
- Dashboard loads
- Sites page works
- Clients page works
- Settings pages accessible

**Step 5: Commit Vercel config**

```bash
git add .vercel/
git commit -m "chore: add vercel project config"
```

---

## Task 23: Update CLAUDE.md

**Files:**
- Modify: `~/wp-dispatch/CLAUDE.md`

**Step 1: Rewrite CLAUDE.md**

Update to reflect WP Dispatch's full feature set: site management + client portal + Basecamp + AI chat + Bricks editing.

Document all new API routes, database tables, and library files.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for wp-dispatch"
```
