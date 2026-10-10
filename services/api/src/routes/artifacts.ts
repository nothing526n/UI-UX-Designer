import { Router, Request, Response } from "express";
import { dataStore } from "../store.js";
import { ArtifactEnvelopeSchema } from "@platform/contracts";

export const artifactsRouter = Router();

// List artifacts for a project
artifactsRouter.get("/projects/:projectId/artifacts", (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { type, branch } = req.query;

  let list = dataStore.listArtifacts(projectId);
  if (type) {
    list = list.filter((a) => a.artifactType === type);
  }
  if (branch) {
    list = list.filter((a) => a.branch === branch);
  }

  res.json({ success: true, count: list.length, artifacts: list });
});

// Create an artifact
artifactsRouter.post("/projects/:projectId/artifacts", (req: Request, res: Response) => {
  const { projectId } = req.params;
  const parsed = ArtifactEnvelopeSchema.safeParse({
    ...req.body,
    projectId,
    id: req.body.id || `art_${Date.now()}`,
  });

  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.format() });
  }

  dataStore.saveArtifact(parsed.data);
  res.status(201).json({ success: true, artifact: parsed.data });
});

// Get a single artifact by ID
artifactsRouter.get("/artifacts/:id", (req: Request, res: Response) => {
  const artifact = dataStore.getArtifact(req.params.id);
  if (!artifact) {
    return res.status(404).json({ success: false, error: "Artifact not found" });
  }
  res.json({ success: true, artifact });
});

// Commit an artifact version
artifactsRouter.post("/artifacts/:id/commit", (req: Request, res: Response) => {
  const committed = dataStore.commitArtifact(req.params.id);
  if (!committed) {
    return res.status(404).json({ success: false, error: "Artifact not found" });
  }
  res.json({ success: true, artifact: committed });
});

// Rollback an artifact (creates new immutable version derived from historical artifact)
artifactsRouter.post("/artifacts/:id/rollback", (req: Request, res: Response) => {
  const rolledBack = dataStore.rollbackArtifact(req.params.id);
  if (!rolledBack) {
    return res.status(404).json({ success: false, error: "Historical artifact not found" });
  }
  res.json({ success: true, artifact: rolledBack });
});
