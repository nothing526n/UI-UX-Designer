import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import { AssetMetadata } from "@platform/contracts";
import { dataStore } from "../store.js";

const STORAGE_ROOT = path.join(os.tmpdir(), "platform-assets");

export interface PresignedUploadPayload {
  assetId: string;
  uploadUrl: string;
  uploadToken: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
}

export class AssetService {
  constructor() {
    if (!fs.existsSync(STORAGE_ROOT)) {
      fs.mkdirSync(STORAGE_ROOT, { recursive: true });
    }
  }

  /**
   * Generates presigned upload payload for client-side direct upload
   */
  public generatePresignedUploadUrl(params: {
    organizationId: string;
    projectId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedBy: string;
  }): PresignedUploadPayload {
    // 25MB maximum upload limit
    const MAX_SIZE = 25 * 1024 * 1024;
    if (params.sizeBytes > MAX_SIZE) {
      throw new Error(`Asset size exceeds maximum limit of 25MB (provided: ${(params.sizeBytes / 1024 / 1024).toFixed(1)}MB)`);
    }

    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const uploadToken = crypto.randomBytes(24).toString("hex");
    const storagePath = path.join(params.organizationId, params.projectId, assetId, params.fileName);

    const asset: AssetMetadata = {
      id: assetId,
      organizationId: params.organizationId,
      projectId: params.projectId,
      fileName: params.fileName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      sha256: "pending",
      storagePath,
      bucket: "platform-assets",
      uploadedBy: params.uploadedBy,
      createdAt: new Date().toISOString(),
    };

    dataStore.saveAsset(asset);

    return {
      assetId,
      uploadUrl: `/api/v1/assets/${assetId}/upload?token=${uploadToken}`,
      uploadToken,
      headers: {
        "Content-Type": params.mimeType,
      },
      expiresInSeconds: 900, // 15 minutes
    };
  }

  /**
   * Saves binary buffer to storage and calculates SHA-256 hash
   */
  public saveAssetBuffer(assetId: string, buffer: Buffer): AssetMetadata {
    const asset = dataStore.getAsset(assetId);
    if (!asset) {
      throw new Error("Asset reservation not found");
    }

    const fullPath = path.join(STORAGE_ROOT, asset.storagePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);

    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    asset.sha256 = sha256;
    asset.sizeBytes = buffer.length;

    dataStore.saveAsset(asset);
    return asset;
  }

  /**
   * Resolves local disk path or download stream
   */
  public getAssetFilePath(assetId: string): string | null {
    const asset = dataStore.getAsset(assetId);
    if (!asset) return null;

    const fullPath = path.join(STORAGE_ROOT, asset.storagePath);
    if (!fs.existsSync(fullPath)) return null;

    return fullPath;
  }
}

export const assetService = new AssetService();
