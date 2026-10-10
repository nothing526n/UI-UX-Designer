import { Router, Request, Response } from "express";
import { dataStore } from "../store.js";
import archiver from "archiver";
import { CodeSnapshotContent, DesignSystemContent, ProductSpecContent } from "@platform/contracts";

export const exportsRouter = Router();

// Create project export
exportsRouter.post("/projects/:projectId/export", (req: Request, res: Response) => {
  const { projectId } = req.params;
  const project = dataStore.getProject(projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: "Project not found" });
  }

  res.json({
    success: true,
    downloadUrl: `/api/v1/projects/${projectId}/export/download`,
    exportManifest: {
      projectId,
      projectName: project.name,
      formats: ["nextjs-source-code", "design-tokens-json", "markdown-documentation"],
      ready: true,
    },
  });
});

// Download project zip archive
exportsRouter.get("/projects/:projectId/export/download", (req: Request, res: Response) => {
  const { projectId } = req.params;
  const project = dataStore.getProject(projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: "Project not found" });
  }

  const artifacts = dataStore.listArtifacts(projectId);
  const codeArtifact = artifacts.find((a) => a.artifactType === "CODE_SNAPSHOT");
  const dsArtifact = artifacts.find((a) => a.artifactType === "DESIGN_SYSTEM");
  const specArtifact = artifacts.find((a) => a.artifactType === "PRODUCT_SPEC");

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${project.name.toLowerCase().replace(/\s+/g, "_")}_export.zip"`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);

  // 1. Add generated code files
  if (codeArtifact) {
    const code = codeArtifact.content as CodeSnapshotContent;
    for (const file of code.files) {
      archive.append(file.content, { name: `src/${file.path}` });
    }

    // package.json
    const pkgJson = {
      name: project.name.toLowerCase().replace(/\s+/g, "-"),
      version: "1.0.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: code.dependencies,
      devDependencies: code.devDependencies,
    };
    archive.append(JSON.stringify(pkgJson, null, 2), { name: "package.json" });
  }

  // 2. Add design tokens
  if (dsArtifact) {
    const ds = dsArtifact.content as DesignSystemContent;
    archive.append(JSON.stringify(ds, null, 2), { name: "design-system/tokens.json" });
  }

  // 3. Add documentation
  if (specArtifact) {
    const spec = specArtifact.content as ProductSpecContent;
    const docMd = `# ${spec.title}\n\n## Vision\n${spec.vision}\n\n## Summary\n${spec.summary}\n\n## Features\n${spec.features
      .map((f) => `### ${f.title} (${f.priority})\n${f.description}\n\nAcceptance Criteria:\n${f.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}`)
      .join("\n\n")}`;
    archive.append(docMd, { name: "README.md" });
  }

  archive.finalize();
});
