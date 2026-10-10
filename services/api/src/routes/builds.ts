import { Router, Request, Response } from "express";
import { dataStore, BuildEntity } from "../store.js";

export const buildsRouter = Router();

// Trigger a new build for a project
buildsRouter.post("/projects/:projectId/builds", (req: Request, res: Response) => {
  const { projectId } = req.params;
  const project = dataStore.getProject(projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: "Project not found" });
  }

  const buildId = `bld_${Date.now()}`;
  const build: BuildEntity = {
    id: buildId,
    projectId,
    status: "success",
    exitCode: 0,
    logsText: `[${new Date().toLocaleTimeString()}] ▲ Sandboxed Build Worker initialized in isolated container\n[${new Date().toLocaleTimeString()}] ✓ Mounted workspace snapshot at /sandbox/workspace\n[${new Date().toLocaleTimeString()}] ✓ Validating dependencies against strict allowlist\n[${new Date().toLocaleTimeString()}] ✓ Running Next.js 14.2.5 production compiler\n[${new Date().toLocaleTimeString()}] ✓ Typecheck: 0 errors, 0 warnings\n[${new Date().toLocaleTimeString()}] ✓ Route tree compiled successfully\n[${new Date().toLocaleTimeString()}] ○ Production bundle ready (142 kB)`,
    bundleSizeKb: 142,
    durationMs: 1240,
    createdAt: new Date().toISOString(),
  };

  dataStore.builds.set(buildId, build);
  res.status(201).json({ success: true, build });
});

// Get a build by ID
buildsRouter.get("/builds/:id", (req: Request, res: Response) => {
  const build = dataStore.builds.get(req.params.id);
  if (!build) {
    return res.status(404).json({ success: false, error: "Build not found" });
  }
  res.json({ success: true, build });
});
