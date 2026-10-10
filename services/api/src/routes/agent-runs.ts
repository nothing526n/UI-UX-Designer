import { Router, Request, Response } from "express";
import {
  AIOrchestrator,
  promptRegistry,
  agentRegistry,
  modelGateway,
} from "@platform/agent-runtime";
import { dataStore } from "../store.js";
import { enforceTenantIsolation } from "../middleware/rbac.js";

export const agentRunsRouter = Router();
const orchestrator = new AIOrchestrator();

// In-memory registry of run records for fast retrieval
export interface RunRecord {
  runId: string;
  projectId: string;
  prompt: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  plan?: any;
  error?: string;
  totalTokens?: number;
  costUsd?: number;
}

export const runRecords = new Map<string, RunRecord>();

/**
 * POST /api/v1/projects/:projectId/agent-runs
 * Start an agent execution run (synchronous or background)
 */
agentRunsRouter.post(
  "/projects/:projectId/agent-runs",
  enforceTenantIsolation("projectId"),
  async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { prompt, synchronous = true } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ success: false, error: "Prompt string is required" });
    }

    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: RunRecord = {
      runId,
      projectId,
      prompt,
      status: "running",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    runRecords.set(runId, record);

    if (synchronous) {
      try {
        dataStore.updateProjectState(projectId, "ANALYZING");
        const result = await orchestrator.executeGoldenLoop(projectId, prompt);

        for (const art of result.artifacts) {
          dataStore.saveArtifact(art);
        }
        dataStore.updateProjectState(projectId, result.state);

        record.status = "completed";
        record.plan = result.plan;
        record.updatedAt = new Date().toISOString();

        return res.json({
          success: true,
          runId,
          status: record.status,
          state: result.state,
          plan: result.plan,
          artifactsCreated: result.artifacts.length,
          artifacts: result.artifacts,
        });
      } catch (err: any) {
        record.status = "failed";
        record.error = err.message;
        record.updatedAt = new Date().toISOString();
        return res.status(500).json({ success: false, runId, error: err.message });
      }
    } else {
      // Asynchronous background trigger
      dataStore.updateProjectState(projectId, "ANALYZING");
      orchestrator
        .executeGoldenLoop(projectId, prompt)
        .then((result) => {
          for (const art of result.artifacts) {
            dataStore.saveArtifact(art);
          }
          dataStore.updateProjectState(projectId, result.state);
          record.status = "completed";
          record.plan = result.plan;
          record.updatedAt = new Date().toISOString();
        })
        .catch((err) => {
          record.status = "failed";
          record.error = err.message;
          record.updatedAt = new Date().toISOString();
        });

      return res.status(202).json({
        success: true,
        runId,
        status: "queued",
        eventStreamUrl: `/api/v1/projects/${projectId}/events`,
      });
    }
  }
);

/**
 * GET /api/v1/projects/:projectId/agent-runs
 * List all runs for the project
 */
agentRunsRouter.get(
  "/projects/:projectId/agent-runs",
  enforceTenantIsolation("projectId"),
  (req: Request, res: Response) => {
    const { projectId } = req.params;
    const runs = Array.from(runRecords.values()).filter((r) => r.projectId === projectId);
    res.json({ success: true, count: runs.length, runs });
  }
);

/**
 * GET /api/v1/agent-runs/:runId
 * Get details of a single agent run
 */
agentRunsRouter.get("/agent-runs/:runId", (req: Request, res: Response) => {
  const record = runRecords.get(req.params.runId);
  if (!record) {
    return res.status(404).json({ success: false, error: "Agent run not found" });
  }

  const liveSession = orchestrator.getRun(req.params.runId);
  res.json({
    success: true,
    run: record,
    isLiveSession: Boolean(liveSession),
    activeStep: liveSession?.plan?.currentStepIndex,
  });
});

/**
 * POST /api/v1/agent-runs/:runId/cancel
 * Cancel an active agent run
 */
agentRunsRouter.post("/agent-runs/:runId/cancel", (req: Request, res: Response) => {
  const { runId } = req.params;
  const cancelled = orchestrator.cancelRun(runId);
  const record = runRecords.get(runId);
  if (record) {
    record.status = "cancelled";
    record.updatedAt = new Date().toISOString();
  }

  res.json({
    success: true,
    cancelled,
    message: cancelled ? "Run cancelled successfully" : "Run was not active in memory or already completed",
  });
});

/**
 * GET /api/v1/prompts
 * List versioned prompt templates
 */
agentRunsRouter.get("/prompts", (req: Request, res: Response) => {
  const list = promptRegistry.listTemplates();
  res.json({ success: true, count: list.length, templates: list });
});

/**
 * GET /api/v1/agents
 * List registered agent capabilities
 */
agentRunsRouter.get("/agents", (req: Request, res: Response) => {
  const list = agentRegistry.list();
  res.json({ success: true, count: list.length, agents: list });
});

/**
 * GET /api/v1/models
 * Model catalog and provider health
 */
agentRunsRouter.get("/models", (req: Request, res: Response) => {
  const telemetry = modelGateway.getTelemetry();
  res.json({
    success: true,
    providers: [
      { name: "mock", status: "active", description: "Zero-cost deterministic fast-path" },
      { name: "gemini", status: process.env.GEMINI_API_KEY ? "active" : "standby", description: "Google Gemini 1.5 Pro & Flash" },
      { name: "anthropic", status: process.env.ANTHROPIC_API_KEY ? "active" : "standby", description: "Claude 3.5 Sonnet" },
      { name: "openai", status: process.env.OPENAI_API_KEY ? "active" : "standby", description: "GPT-4o & GPT-4o-mini" },
    ],
    telemetry,
  });
});
