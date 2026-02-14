# WP Dispatch — Merge Design

**Date**: 2026-02-13
**Status**: Approved
**Repos**: wp-jupiter (base) + bricks-cc (feature port)
**Target**: ~/wp-dispatch (Aventerica89/wp-dispatch)

---

## Overview

WP Dispatch combines wp-jupiter's WordPress site management platform with bricks-cc's client management, Basecamp integration, AI chat, and Bricks Builder editing into a single unified product.

The bricks-cc teaching/build system (lessons, scenarios, AI agents for Bricks generation) stays in bricks-cc as a separate tool.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Base repo | wp-jupiter | More mature (22 tables, 63 tests, shadcn/ui, Next.js 16) |
| Approach | Fork + port | Least work, carries proven code forward |
| Stack | Next.js 16 + React 19 + Turso/Drizzle + shadcn/ui + Tailwind v4 | Already built in wp-jupiter |
| Auth | PIN (upgrade later) | Simple, fast to ship |
| Database | Single unified Turso schema | Simpler than multi-DB, deduplicates tables |
| Bricks AI | Stays in bricks-cc | Separate concern, not part of site management |

## What Carries Over from wp-jupiter

All existing features, untouched:
- 26 shadcn/ui components
- Site management (CRUD, health, bulk sync)
- Plugin/theme tracking + bulk updates
- Infrastructure (providers, servers, projects, tags)
- Monitoring (uptime, performance, security, backups)
- Automation (scheduled jobs, notifications)
- WordPress connector plugin (PHP)
- 63 existing tests
- White-label settings, client portal

## What Gets Ported from bricks-cc

### Libraries
- `BasecampClient` class — Basecamp 3 API wrapper (projects, todos, messages)
- `BricksClient` class — WordPress/Bricks REST API wrapper
- `claude-cli.ts` — Anthropic SDK wrapper
- `context.ts` — Chat context builder (adapted for unified sites table)
- `secure-keys.ts` — AES-256-GCM encryption for API keys/tokens
- `rate-limit.ts` — Per-endpoint rate limiting

### Features
- Client management (profiles, per-client site grouping)
- Basecamp integration (OAuth, sync, webhooks, feedback pipeline)
- AI Chat (Claude-powered, context-aware, CORS widget support)
- Bricks page editing (API proxy, AI-generated element edits)
- Client feedback (submission form, Basecamp todo sync)

## What Gets Dropped

These stay in bricks-cc only:
- Teaching system (lessons, scenarios, content assets)
- Build system (multi-phase AI generation, visual comparisons)
- Agent architecture (BaseAgent, StructureAgent, prompts)
- Agent instructions + GitHub sync

## Database Schema

### Existing tables (unchanged): 22 tables from wp-jupiter

### Modified table: `sites`
New columns added:
- `bricks_api_key` (text, encrypted) — Bricks REST API auth
- `basecamp_project_id` (text) — Link to Basecamp project
- `client_id` (integer, FK → clients) — Associate site with client

### New tables (from bricks-cc): 5 tables
- `clients` — id, name, email, company, avatar_url, is_active, timestamps
- `chat_messages` — id, client_id, site_id, user_message, claude_response, metadata, timestamps
- `client_feedback` — id, client_id, site_id, feedback_type, message, basecamp_todo_id, status, timestamps
- `bricks_pages` — id, site_id, page_id, title, structure, last_fetch, editable_by_client
- `basecamp_sync` — id, site_id, basecamp_account_id, project_id, api_token (encrypted), sync_status, last_sync

### Total: ~28 tables

## Routing

### Existing routes (unchanged)
```
/dashboard, /sites/*, /projects, /updates, /tags, /activity, /settings/*
```

### New pages
```
/clients            — Client directory
/clients/new        — Create client
/clients/[id]       — Client detail (tabs: sites, chat, feedback, settings)
/clients/[id]/chat  — AI chat with client context
/basecamp           — Basecamp projects overview + sync status
/settings/basecamp  — Basecamp OAuth config
/settings/ai        — Anthropic API key config
```

### New API routes
```
POST   /api/chat              — Claude chat endpoint (CORS)
GET    /api/clients            — List clients
POST   /api/clients            — Create client
GET    /api/clients/[id]/sites — Client's sites
POST   /api/feedback           — Submit feedback
GET    /api/basecamp           — Fetch projects/todos
POST   /api/basecamp/sync      — Sync operations
POST   /api/basecamp/webhooks  — Webhook receiver
GET    /api/basecamp/callback  — OAuth callback
GET/POST /api/bricks           — Bricks API proxy
POST   /api/bricks/edit        — Apply element edits
```

## Implementation Phases

### Phase 1 — Foundation
- Create repo from wp-jupiter (shallow clone, new remote)
- Rename branding → WP Dispatch
- Swap JWT auth → PIN auth
- Verify build + tests pass
- Deploy to Vercel

### Phase 2 — Schema Extension
- Add 5 new tables + 3 new columns on sites
- Run migration, verify in Drizzle Studio

### Phase 3 — Core Libraries
- Port BasecampClient, BricksClient, secure-keys, rate-limit, claude-cli
- Adapt context.ts for unified sites table
- Add env vars

### Phase 4 — Client Management
- /clients routes + API
- ClientsList with DataTable
- Client detail page with tabs
- Link clients to sites via client_id

### Phase 5 — Basecamp Integration
- /basecamp page + /settings/basecamp
- OAuth flow + webhook receiver
- Sync endpoint + feedback pipeline

### Phase 6 — AI Chat + Bricks Editing
- /api/chat with context builder
- ChatInterface (shadcn rebuild)
- ChatWidget (embeddable)
- Bricks proxy + edit endpoint
- /settings/ai config

### Phase 7 — Polish + Testing
- Port + write tests (80% coverage)
- Update CLAUDE.md, README
- Final deploy

## Environment Variables

Existing (from wp-jupiter):
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- `JWT_SECRET` → replaced by `PIN_CODE`

New (from bricks-cc):
- `ANTHROPIC_API_KEY`
- `BASECAMP_ACCOUNT_ID`, `BASECAMP_OAUTH_TOKEN`
- `ENCRYPTION_KEY`
- `WIDGET_ALLOWED_ORIGINS`
