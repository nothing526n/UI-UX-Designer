# AI UI/UX Designer & Design-to-Code Platform — Complete Source Code

> **Production-Grade Multi-Agent Studio** — A monorepo TypeScript platform with 8 specialized AI agents, a REST API gateway, distributed queue, sandboxed build worker, and full design-to-code pipeline.

---

## 📁 Project Structure

```
ai-ui-ux-designer-platform/
├── package.json                          # Root monorepo config (npm workspaces)
├── tsconfig.base.json                    # Shared TypeScript compiler options
├── docker-compose.yml                    # Full-stack Docker orchestration
├── .env.example                          # Environment template
├── .gitignore
├── packages/
│   └── contracts/                        # @platform/contracts — Shared Zod schemas & types
│       ├── src/
│       │   ├── index.ts                  # Barrel exports
│       │   ├── common.ts                 # Core enums, ArtifactEnvelope, Org, Audit
│       │   ├── agent.ts                  # Agent types, ToolCalls, TaskPlan
│       │   ├── screen.ts                 # LayoutNode AST, AutoLayout, StyleProperties
│       │   ├── design-system.ts          # Tokens, Variables, Components
│       │   ├── ux.ts                     # Personas, Journeys, IA, Wireframes
│       │   ├── code.ts                   # CodeSnapshot, FileDiff
│       │   ├── code-connect.ts           # Figma Code Connect mappings
│       │   ├── events.ts                 # Realtime SSE event types
│       │   ├── model.ts                  # Model gateway request/response
│       │   ├── prototype.ts              # Interactions, transitions
│       │   ├── requirements.ts           # ProductSpec, Features, Actors
│       │   └── qa.ts                     # QA reports, issues, evidence
│       ├── package.json
│       └── tsconfig.json
├── services/
│   ├── agent-runtime/                    # @platform/agent-runtime — AI Orchestrator & Agents
│   │   ├── src/
│   │   │   ├── index.ts                  # Barrel exports
│   │   │   ├── orchestrator.ts           # AIOrchestrator — Golden Loop engine
│   │   │   ├── agents/
│   │   │   │   ├── requirements-agent.ts # ProductSpec synthesis
│   │   │   │   ├── ux-research-agent.ts  # Personas & Journeys
│   │   │   │   ├── ux-designer-agent.ts  # IA, Flows, Wireframes
│   │   │   │   ├── design-system-agent.ts# Tokens & Components
│   │   │   │   ├── ui-designer-agent.ts  # Hi-Fi Screen LayoutNode AST
│   │   │   │   ├── prototype-agent.ts    # Interactive prototype graph
│   │   │   │   ├── frontend-code-agent.ts# Next.js 14 code generation
│   │   │   │   └── qa-agent.ts           # Multi-category QA audit
│   │   │   ├── gateway/
│   │   │   │   ├── adapter-interface.ts  # IModelProviderAdapter
│   │   │   │   ├── model-gateway.ts      # Multi-provider fallback gateway
│   │   │   │   └── adapters/
│   │   │   │       ├── gemini-adapter.ts
│   │   │   │       ├── anthropic-adapter.ts
│   │   │   │       ├── openai-adapter.ts
│   │   │   │       └── mock-adapter.ts
│   │   │   ├── registry/
│   │   │   │   ├── agent-registry.ts     # Agent definitions & permissions
│   │   │   │   ├── prompt-registry.ts    # Versioned prompt templates
│   │   │   │   └── code-connect-registry.ts # Figma → React mappings
│   │   │   ├── context/
│   │   │   │   └── context-builder.ts    # Token-budgeted prompt assembly
│   │   │   ├── eval/
│   │   │   │   ├── golden-dataset.ts     # 4 domain test cases
│   │   │   │   └── regression-harness.ts # Automated quality benchmark
│   │   │   ├── rag/
│   │   │   │   └── vector-store.ts       # Semantic search with cosine similarity
│   │   │   └── tools/
│   │   │       ├── tool-registry.ts      # 14 registered platform tools
│   │   │       ├── dom-to-ast.ts         # DOM → LayoutNode converter
│   │   │       └── figma-mcp-client.ts   # Figma design context client
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/                              # @platform/api — Express REST gateway
│   │   ├── src/
│   │   │   ├── index.ts                  # Server entry point
│   │   │   ├── server.ts                 # Express app factory
│   │   │   ├── store.ts                  # In-memory DataStore
│   │   │   ├── auth/
│   │   │   │   ├── oauth-service.ts      # Google & GitHub OAuth 2.0
│   │   │   │   └── saml-service.ts       # Okta SAML 2.0 SSO
│   │   │   ├── db/
│   │   │   │   ├── database-service.ts   # PostgreSQL + in-memory dual mode
│   │   │   │   ├── seed.ts              # Database seeder
│   │   │   │   └── migrations/
│   │   │   │       └── 0001_initial_schema.sql
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts              # JWT auth + dev headers
│   │   │   │   ├── rbac.ts             # Role-based access control
│   │   │   │   ├── security.ts          # Security headers + rate limiter
│   │   │   │   └── audit.ts            # Immutable audit logging
│   │   │   ├── queue/
│   │   │   │   └── distributed-queue.ts # BullMQ/in-memory job queue
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts, orgs.ts, projects.ts, artifacts.ts
│   │   │   │   ├── assets.ts, events.ts, builds.ts, previews.ts
│   │   │   │   ├── qa.ts, exports.ts, agent-runs.ts, figma.ts
│   │   │   └── services/
│   │   │       └── asset-service.ts     # Presigned upload & storage
│   │   ├── prisma/schema.prisma          # PostgreSQL schema (11 models)
│   │   ├── Dockerfile
│   │   └── package.json
│   └── build-worker/                     # @platform/build-worker — Sandboxed builds
│       ├── src/
│       │   ├── index.ts                  # Express build API
│       │   └── sandbox.ts               # Docker/process isolation
│       ├── Dockerfile
│       ├── docker-compose.sandbox.yml
│       └── package.json
└── scratch_docs/                         # Design research documents
```

---

## 🔧 Root Configuration Files

### [package.json](file:///s:/UI%20UX%20Designer%20Agent/package.json)
```json
{
  "name": "ai-ui-ux-designer-platform",
  "version": "1.0.0",
  "description": "AI UI/UX Designer & Design-to-Code Platform - Production-Grade Multi-Agent Studio",
  "private": true,
  "workspaces": [
    "packages/*",
    "services/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "npm run dev:web",
    "dev:web": "npm run dev --workspace=@platform/web",
    "dev:api": "npm run dev --workspace=@platform/api",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  },
  "keywords": ["ai", "ui-ux", "design-to-code", "multi-agent", "design-system", "nextjs"],
  "author": "Google DeepMind / Antigravity Team",
  "license": "MIT"
}
```

### [tsconfig.base.json](file:///s:/UI%20UX%20Designer%20Agent/tsconfig.base.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true
  }
}
```

### [docker-compose.yml](file:///s:/UI%20UX%20Designer%20Agent/docker-compose.yml)
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: platform-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: platform
      POSTGRES_PASSWORD: platform_dev_password
      POSTGRES_DB: platform_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U platform -d platform_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: platform-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: services/api/Dockerfile
    container_name: platform-api
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      PORT: 4000
      DATABASE_URL: postgresql://platform:platform_dev_password@postgres:5432/platform_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: platform_foundation_secret_key_change_in_prod
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: platform-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      NEXT_PUBLIC_API_URL: http://localhost:4000
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

---

> [!NOTE]
> The full source code for all ~80+ files is extremely large. Below are all the key source files organized by package. Each file heading links to the actual file on disk.

---

## 📦 Package: `@platform/contracts`

All shared Zod schemas and TypeScript types used across the platform.

### [index.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/index.ts) — Barrel Exports
### [common.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/common.ts) — Core Enums & Schemas (ArtifactEnvelope, WorkflowState, Orgs, Audit)
### [agent.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/agent.ts) — Agent Types, ToolCalls, TaskPlan, AgentRunRecord
### [screen.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/screen.ts) — LayoutNode AST, AutoLayout, StyleProperties, ScreenContent
### [design-system.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/design-system.ts) — Design Tokens, Variables, Components
### [ux.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/ux.ts) — Personas, Journeys, IA, UserFlows, Wireframes
### [code.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/code.ts) — CodeSnapshot, FileDiff
### [code-connect.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/code-connect.ts) — Figma Code Connect Mappings
### [events.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/events.ts) — Realtime Event Types
### [model.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/model.ts) — Model Gateway Request/Response
### [prototype.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/prototype.ts) — Interactions, Transitions
### [requirements.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/requirements.ts) — ProductSpec, Features, Actors
### [qa.ts](file:///s:/UI%20UX%20Designer%20Agent/packages/contracts/src/qa.ts) — QA Reports, Issues, Evidence

---

## 🤖 Service: `@platform/agent-runtime`

The AI orchestrator and 8 specialized agents.

### [orchestrator.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/orchestrator.ts) — AIOrchestrator Golden Loop (8-step pipeline)
### [requirements-agent.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/agents/requirements-agent.ts) — ProductSpec Synthesis
### [ux-research-agent.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/agents/ux-research-agent.ts) — Personas & Journeys
### [ux-designer-agent.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/agents/ux-designer-agent.ts) — IA, Flows, Wireframes
### [design-system-agent.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/agents/design-system-agent.ts) — Tokens & Components
### [ui-designer-agent.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/agents/ui-designer-agent.ts) — Hi-Fi Screen LayoutNode AST
### [prototype-agent.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/agents/prototype-agent.ts) — Interactive Prototype Graph
### [frontend-code-agent.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/agents/frontend-code-agent.ts) — Next.js 14 Code Generation
### [qa-agent.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/agents/qa-agent.ts) — Multi-Category QA Audit

### Gateway & Adapters
- [adapter-interface.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/gateway/adapter-interface.ts) — IModelProviderAdapter interface
- [model-gateway.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/gateway/model-gateway.ts) — Multi-provider fallback with telemetry
- [gemini-adapter.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/gateway/adapters/gemini-adapter.ts) — Gemini 1.5 Flash/Pro
- [anthropic-adapter.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/gateway/adapters/anthropic-adapter.ts) — Claude 3.5 Sonnet
- [openai-adapter.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/gateway/adapters/openai-adapter.ts) — GPT-4o-mini
- [mock-adapter.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/gateway/adapters/mock-adapter.ts) — Always-available fallback

### Registries
- [agent-registry.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/registry/agent-registry.ts) — 8 canonical agent definitions
- [prompt-registry.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/registry/prompt-registry.ts) — Versioned prompt templates
- [code-connect-registry.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/registry/code-connect-registry.ts) — Figma → React prop mappings

### Context, Eval, RAG, Tools
- [context-builder.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/context/context-builder.ts) — Token-budgeted prompt assembly
- [golden-dataset.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/eval/golden-dataset.ts) — 4 domain test cases
- [regression-harness.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/eval/regression-harness.ts) — Automated quality benchmark
- [vector-store.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/rag/vector-store.ts) — Semantic search (cosine similarity, pgvector DDL)
- [tool-registry.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/tools/tool-registry.ts) — 14 registered platform tools
- [dom-to-ast.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/tools/dom-to-ast.ts) — DOM → LayoutNode converter
- [figma-mcp-client.ts](file:///s:/UI%20UX%20Designer%20Agent/services/agent-runtime/src/tools/figma-mcp-client.ts) — Figma design context client

---

## 🌐 Service: `@platform/api`

Express.js REST API Gateway with 12 route modules.

### Core
- [index.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/index.ts) — Server entry point (port 4000)
- [server.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/server.ts) — Express app factory with health check
- [store.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/store.ts) — In-memory DataStore (auto-seeds golden loop)

### Authentication
- [oauth-service.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/auth/oauth-service.ts) — Google & GitHub OAuth 2.0
- [saml-service.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/auth/saml-service.ts) — Okta SAML 2.0 SSO

### Database
- [database-service.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/db/database-service.ts) — PostgreSQL + in-memory dual mode
- [seed.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/db/seed.ts) — Database seeder
- [schema.prisma](file:///s:/UI%20UX%20Designer%20Agent/services/api/prisma/schema.prisma) — 11 Prisma models

### Middleware
- [auth.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/middleware/auth.ts) — JWT (HS256) + dev headers + fallback
- [rbac.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/middleware/rbac.ts) — Role-based access + tenant isolation
- [security.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/middleware/security.ts) — Security headers + rate limiter
- [audit.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/middleware/audit.ts) — Immutable audit logging

### Queue & Services
- [distributed-queue.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/queue/distributed-queue.ts) — BullMQ/in-memory job queue (4 queues)
- [asset-service.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/services/asset-service.ts) — Presigned upload & local storage

### API Routes (12 modules)
- [auth.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/auth.ts), [orgs.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/orgs.ts), [projects.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/projects.ts), [artifacts.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/artifacts.ts)
- [assets.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/assets.ts), [events.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/events.ts), [builds.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/builds.ts), [previews.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/previews.ts)
- [qa.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/qa.ts), [exports.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/exports.ts), [agent-runs.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/agent-runs.ts), [figma.ts](file:///s:/UI%20UX%20Designer%20Agent/services/api/src/routes/figma.ts)

---

## 🏗️ Service: `@platform/build-worker`

Sandboxed Next.js build execution with Docker/process isolation.

- [index.ts](file:///s:/UI%20UX%20Designer%20Agent/services/build-worker/src/index.ts) — Express build API (port 4001)
- [sandbox.ts](file:///s:/UI%20UX%20Designer%20Agent/services/build-worker/src/sandbox.ts) — Docker cgroup isolation + process jail
- [Dockerfile](file:///s:/UI%20UX%20Designer%20Agent/services/build-worker/Dockerfile) — Multi-stage Alpine container
- [docker-compose.sandbox.yml](file:///s:/UI%20UX%20Designer%20Agent/services/build-worker/docker-compose.sandbox.yml) — Resource-limited compose

---

## 🔑 Key Architecture Highlights

| Component | Technology | Purpose |
|:---|:---|:---|
| **Contracts** | Zod + TypeScript | 13 schema modules, runtime validation |
| **Orchestrator** | 8-step Golden Loop | Requirements → UX → UI → Code → QA |
| **Model Gateway** | Gemini/Claude/GPT-4/Mock | Auto-fallback with telemetry |
| **API** | Express 4 + PostgreSQL 16 | 12 REST route modules + SSE events |
| **Auth** | JWT HS256 + OAuth + SAML | Google, GitHub, Okta SSO |
| **Queue** | BullMQ / In-memory | 4 job queues (agent, build, qa, events) |
| **Build Worker** | Docker sandbox | cgroup-isolated Next.js 14 builds |
| **RAG** | Cosine similarity vector store | Deterministic 64-dim embeddings |
| **Eval** | Regression harness | 4 golden test cases, P95 benchmarks |
