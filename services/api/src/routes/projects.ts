import { Router, Request, Response } from "express";
import { dataStore } from "../store.js";
import { AIOrchestrator } from "@platform/agent-runtime";
import { enforceTenantIsolation } from "../middleware/rbac.js";
import { broadcastProjectEvent } from "./events.js";

export const projectsRouter = Router();
const orchestrator = new AIOrchestrator();

// List all projects (scoped to active organization)
projectsRouter.get("/", (req: Request, res: Response) => {
  const orgId = req.user?.activeOrganizationId;
  const list = dataStore.listProjects(orgId);
  res.json({ success: true, count: list.length, organizationId: orgId, projects: list });
});

// Create a new project within active organization
projectsRouter.post("/", (req: Request, res: Response) => {
  const { name, description, targetPlatform, organizationId } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: "Project name is required" });
  }

  const activeOrgId = organizationId || req.user?.activeOrganizationId || "org_apex_global";
  const project = dataStore.createProject(name, description || "", targetPlatform || "web", activeOrgId);
  res.status(201).json({ success: true, project });
});

// Get a single project (enforcing tenant isolation)
projectsRouter.get("/:id", enforceTenantIsolation("id"), (req: Request, res: Response) => {
  const project = dataStore.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: "Project not found" });
  }

  const artifacts = dataStore.listArtifacts(project.id);
  res.json({
    success: true,
    project,
    artifactCount: artifacts.length,
    artifactsSummary: artifacts.map((a) => ({
      id: a.id,
      type: a.artifactType,
      version: a.version,
      status: a.status,
    })),
  });
});

// Trigger generation from user prompt (enforcing tenant isolation)
projectsRouter.post("/:id/generate", enforceTenantIsolation("id"), async (req: Request, res: Response) => {
  const project = dataStore.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: "Project not found" });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ success: false, error: "Prompt string is required" });
  }

  try {
    dataStore.updateProjectState(project.id, "ANALYZING");
    const result = await orchestrator.executeGoldenLoop(project.id, prompt);


    // Save all generated artifacts
    for (const art of result.artifacts) {
      dataStore.saveArtifact(art);
    }

    dataStore.updateProjectState(project.id, result.state);

    res.json({
      success: true,
      state: result.state,
      plan: result.plan,
      artifactsCreated: result.artifacts.length,
      artifacts: result.artifacts,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || String(err),
    });
  }
});

// Send AI conversational message
projectsRouter.post("/:id/messages", async (req: Request, res: Response) => {
  const project = dataStore.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: "Project not found" });
  }

  const { message, context } = req.body;
  // Generate contextual AI response
  res.json({
    success: true,
    reply: `I analyzed your request: "${message}". I can update the layout, adjust design tokens, or run QA checks on the current screen. Would you like me to generate a diff?`,
    suggestedActions: [
      { id: "act_make_responsive", label: "Make Layout Responsive", agent: "UI_DESIGNER" },
      { id: "act_fix_contrast", label: "Fix Contrast Issues", agent: "ACCESSIBILITY_QA" },
      { id: "act_generate_code", label: "Regenerate React Code", agent: "FRONTEND_CODE" },
    ],
  });
});

// Approve project for production release (enforcing tenant isolation)
projectsRouter.post("/:id/approve", enforceTenantIsolation("id"), (req: Request, res: Response) => {
  const project = dataStore.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: "Project not found" });
  }

  const updated = dataStore.updateProjectState(project.id, "APPROVED");
  broadcastProjectEvent(project.id, "PROJECT_APPROVED", {
    projectId: project.id,
    state: "APPROVED",
    approvedBy: req.user?.id || "usr_mobile_reviewer",
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: "Project approved for production release",
    project: updated,
  });
});

