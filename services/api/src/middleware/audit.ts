import { Request, Response, NextFunction } from "express";
import { dataStore } from "../store.js";
import { AuditLogEntry } from "@platform/contracts";

/**
 * Express middleware that intercepts mutating requests (POST, PUT, PATCH, DELETE)
 * and records an immutable audit log entry in the data store.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const originalSend = res.send;

    res.send = function (body: any): Response {
      // Only record on successful operations (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const orgId = req.user?.activeOrganizationId || "org_apex_global";
          const actorId = req.user?.id || "usr_anonymous";
          const projectId = req.params.projectId || req.params.id;

          let resourceType = "unknown";
          if (req.originalUrl.includes("/projects")) resourceType = "project";
          if (req.originalUrl.includes("/artifacts")) resourceType = "artifact";
          if (req.originalUrl.includes("/assets")) resourceType = "asset";
          if (req.originalUrl.includes("/orgs")) resourceType = "organization";
          if (req.originalUrl.includes("/builds")) resourceType = "build";

          const entry: AuditLogEntry = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            organizationId: orgId,
            projectId: projectId,
            actorId,
            actorType: req.headers["x-agent-call"] ? "agent" : "user",
            action: `${req.method} ${req.baseUrl || ""}${req.path}`,
            resourceType,
            resourceId: req.params.id || req.body?.id,
            metadata: {
              statusCode: res.statusCode,
              ip: req.ip,
              timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          };

          dataStore.recordAuditLog(entry);
        } catch (err) {
          console.error("Failed to record audit log:", err);
        }
      }

      return originalSend.call(this, body);
    };
  }

  next();
}
