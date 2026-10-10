import { Request, Response, NextFunction } from "express";
import { MembershipRole } from "@platform/contracts";
import { dataStore } from "../store.js";

/**
 * Middleware factory requiring user to possess at least one of the allowed roles
 */
export function requireRole(allowedRoles: MembershipRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Insufficient role privileges. Required: [${allowedRoles.join(", ")}], Provided: [${req.user.roles.join(", ")}]`,
        },
      });
    }

    next();
  };
}

/**
 * Middleware enforcing tenant isolation for project-scoped routes
 * Verifies that the requested project belongs to the user's active organization
 */
export function enforceTenantIsolation(paramKey: string = "id") {
  return (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params[paramKey] || req.params.projectId;
    if (!projectId) {
      return next();
    }

    const project = dataStore.getProject(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    }

    if (req.user && project.organizationId !== req.user.activeOrganizationId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "TENANT_MISMATCH",
          message: "Access denied. Target project belongs to a different organization workspace.",
        },
      });
    }

    next();
  };
}
