import { Router, Request, Response } from "express";
import { dataStore } from "../store.js";
import { requireRole } from "../middleware/rbac.js";
import { MembershipRoleEnum } from "@platform/contracts";

export const orgsRouter = Router();

/**
 * GET /api/v1/orgs
 * List organizations the authenticated user is a member of
 */
orgsRouter.get("/", (req: Request, res: Response) => {
  const userId = req.user?.id || "usr_admin";
  const userMemberships = Array.from(dataStore.memberships.values()).filter(
    (m) => m.userId === userId
  );

  const orgList = userMemberships
    .map((m) => {
      const org = dataStore.getOrganization(m.organizationId);
      if (!org) return null;
      return {
        ...org,
        currentUserRole: m.role,
      };
    })
    .filter(Boolean);

  res.json({ success: true, count: orgList.length, organizations: orgList });
});

/**
 * POST /api/v1/orgs
 * Create a new organization and assign creator as OWNER
 */
orgsRouter.post("/", (req: Request, res: Response) => {
  const { name, slug } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: "Organization name is required" });
  }

  const userId = req.user?.id || "usr_admin";
  const org = dataStore.createOrganization(name, slug);
  const membership = dataStore.addMembership(org.id, userId, "OWNER");

  res.status(201).json({
    success: true,
    organization: org,
    membership,
  });
});

/**
 * GET /api/v1/orgs/:id/members
 * List members in the specified organization
 */
orgsRouter.get("/:id/members", (req: Request, res: Response) => {
  const orgId = req.params.id;
  const org = dataStore.getOrganization(orgId);
  if (!org) {
    return res.status(404).json({ success: false, error: "Organization not found" });
  }

  const members = dataStore.listMemberships(orgId);
  res.json({ success: true, count: members.length, members });
});

/**
 * POST /api/v1/orgs/:id/members
 * Add or update member role in organization (requires OWNER or ADMIN)
 */
orgsRouter.post("/:id/members", requireRole(["OWNER", "ADMIN"]), (req: Request, res: Response) => {
  const orgId = req.params.id;
  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({ success: false, error: "userId and role are required" });
  }

  const roleParsed = MembershipRoleEnum.safeParse(role);
  if (!roleParsed.success) {
    return res.status(400).json({
      success: false,
      error: `Invalid role. Allowed roles: ${MembershipRoleEnum.options.join(", ")}`,
    });
  }

  const membership = dataStore.addMembership(orgId, userId, roleParsed.data);
  res.status(201).json({ success: true, membership });
});
