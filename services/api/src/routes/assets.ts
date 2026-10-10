import { Router, Request, Response } from "express";
import express from "express";
import { assetService } from "../services/asset-service.js";
import { dataStore } from "../store.js";
import { enforceTenantIsolation } from "../middleware/rbac.js";

export const assetsRouter = Router();

/**
 * POST /api/v1/projects/:projectId/assets/presigned-upload
 * Requests a presigned URL to upload an asset directly
 */
assetsRouter.post(
  "/projects/:projectId/assets/presigned-upload",
  enforceTenantIsolation("projectId"),
  (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { fileName, mimeType, sizeBytes } = req.body;

    if (!fileName || !mimeType || typeof sizeBytes !== "number") {
      return res.status(400).json({
        success: false,
        error: "fileName, mimeType, and numeric sizeBytes are required",
      });
    }

    const orgId = req.user?.activeOrganizationId || "org_apex_global";
    const uploadedBy = req.user?.id || "usr_admin";

    try {
      const payload = assetService.generatePresignedUploadUrl({
        organizationId: orgId,
        projectId,
        fileName,
        mimeType,
        sizeBytes,
        uploadedBy,
      });

      res.status(201).json({ success: true, upload: payload });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

/**
 * GET /api/v1/projects/:projectId/assets
 * Lists all registered assets for the project
 */
assetsRouter.get(
  "/projects/:projectId/assets",
  enforceTenantIsolation("projectId"),
  (req: Request, res: Response) => {
    const { projectId } = req.params;
    const assets = dataStore.listAssets(projectId);
    res.json({ success: true, count: assets.length, assets });
  }
);

/**
 * PUT /api/v1/assets/:assetId/upload
 * Simulated direct upload receiver for local environment
 */
assetsRouter.put(
  "/assets/:assetId/upload",
  express.raw({ type: "*/*", limit: "25mb" }),
  (req: Request, res: Response) => {
    const { assetId } = req.params;
    const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");

    try {
      const saved = assetService.saveAssetBuffer(assetId, buffer);
      res.json({
        success: true,
        message: "Asset upload confirmed and hashed",
        asset: saved,
      });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  }
);

/**
 * GET /api/v1/assets/:assetId/download
 * Downloads or serves the binary asset
 */
assetsRouter.get("/assets/:assetId/download", (req: Request, res: Response) => {
  const { assetId } = req.params;
  const asset = dataStore.getAsset(assetId);
  if (!asset) {
    return res.status(404).json({ success: false, error: "Asset not found" });
  }

  const filePath = assetService.getAssetFilePath(assetId);
  if (!filePath) {
    return res.status(404).json({ success: false, error: "Asset file content not found in storage" });
  }

  res.setHeader("Content-Type", asset.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${asset.fileName}"`);
  res.sendFile(filePath);
});
