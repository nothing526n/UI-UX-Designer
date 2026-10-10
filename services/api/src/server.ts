import express from "express";
import cors from "cors";
import { securityHeaders, rateLimiter } from "./middleware/security.js";
import { authenticate } from "./middleware/auth.js";
import { auditMiddleware } from "./middleware/audit.js";

import { authRouter } from "./routes/auth.js";
import { orgsRouter } from "./routes/orgs.js";
import { projectsRouter } from "./routes/projects.js";
import { artifactsRouter } from "./routes/artifacts.js";
import { assetsRouter } from "./routes/assets.js";
import { eventsRouter } from "./routes/events.js";
import { buildsRouter } from "./routes/builds.js";
import { previewsRouter } from "./routes/previews.js";
import { qaRouter } from "./routes/qa.js";
import { exportsRouter } from "./routes/exports.js";
import { agentRunsRouter } from "./routes/agent-runs.js";
import { figmaRouter } from "./routes/figma.js";
import { dataStore } from "./store.js";

import { databaseService } from "./db/database-service.js";
import { distributedQueueService } from "./queue/distributed-queue.js";

const startTime = Date.now();

export function createServer() {
  const app = express();

  // 1. Core Security & Optimization Middleware
  app.use(securityHeaders);
  app.use(cors());
  app.use(rateLimiter(250, 60000));
  app.use(express.json({ limit: "10mb" }));

  // 2. Identity & Audit Pipeline
  app.use(authenticate);
  app.use(auditMiddleware);

  // 3. System Observability & Health Check
  app.get("/health", (req, res) => {
    const mem = process.memoryUsage();
    const dbStatus = databaseService.getStatus();
    const queueStatus = distributedQueueService.getTelemetry();

    res.json({
      status: "healthy",
      service: "@platform/api",
      version: "1.0.0",
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      subsystems: {
        store: {
          status: "connected",
          type: "in-memory-fast-path",
          projectsCount: dataStore.projects.size,
          artifactsCount: dataStore.artifacts.size,
          organizationsCount: dataStore.organizations.size,
        },
        database: {
          status: dbStatus.status,
          type: dbStatus.type,
          databaseUrlConfigured: dbStatus.databaseUrlConfigured,
          migrationsApplied: dbStatus.migrationsApplied,
        },
        queue: {
          status: queueStatus.status,
          type: queueStatus.type,
          redisUrlConfigured: queueStatus.redisUrlConfigured,
          queues: queueStatus.queues,
          counts: queueStatus.counts,
        },
        sso: {
          status: "operational",
          providers: ["google", "github", "okta_saml"],
        },
        storage: {
          status: "ready",
          type: "local-presigned-fallback",
          assetsCount: dataStore.assets.size,
        },
        eventBus: {
          status: "operational",
          type: "sse-bus",
        },
      },
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      },
    });
  });

  // 4. API v1 Routes
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/orgs", orgsRouter);
  app.use("/api/v1/projects", projectsRouter);
  app.use("/api/v1", artifactsRouter);
  app.use("/api/v1", assetsRouter);
  app.use("/api/v1", eventsRouter);
  app.use("/api/v1", buildsRouter);
  app.use("/api/v1", previewsRouter);
  app.use("/api/v1", qaRouter);
  app.use("/api/v1", exportsRouter);
  app.use("/api/v1", agentRunsRouter);
  app.use("/api/v1", figmaRouter);

  // 5. Distributed Queue & Database Subsystem Endpoints
  app.get("/api/v1/queue/telemetry", (_req, res) => {
    res.json({ success: true, telemetry: distributedQueueService.getTelemetry() });
  });

  app.get("/api/v1/database/status", (_req, res) => {
    res.json({ success: true, database: databaseService.getStatus() });
  });

  app.post("/api/v1/database/migrate", async (_req, res) => {
    const result = await databaseService.runMigrations();
    res.json({ success: result.success, migrations: result.applied, error: result.error });
  });

  return app;
}
