import { Router, Request, Response } from "express";
import { dataStore, PreviewEntity } from "../store.js";

export const previewsRouter = Router();

// Create or refresh preview session
previewsRouter.post("/projects/:projectId/previews", (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { viewportMode } = req.body;

  const previewId = `prev_${Date.now()}`;
  const preview: PreviewEntity = {
    id: previewId,
    projectId,
    buildId: `bld_active`,
    previewUrl: "http://localhost:3000/preview",
    screenshotUrl: `/screenshots/preview_${viewportMode || "desktop"}.png`,
    viewportMode: viewportMode || "desktop",
    createdAt: new Date().toISOString(),
  };

  dataStore.previews.set(previewId, preview);
  res.status(201).json({ success: true, preview });
});

// Get preview details
previewsRouter.get("/previews/:id", (req: Request, res: Response) => {
  const preview = dataStore.previews.get(req.params.id);
  if (!preview) {
    return res.status(404).json({ success: false, error: "Preview session not found" });
  }
  res.json({ success: true, preview });
});
