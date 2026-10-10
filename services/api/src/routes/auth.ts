import { Router, Request, Response } from "express";
import { signDevJwt } from "../middleware/auth.js";
import { dataStore } from "../store.js";
import { oauthService } from "../auth/oauth-service.js";
import { samlService } from "../auth/saml-service.js";
import { MembershipRole } from "@platform/contracts";

export const authRouter = Router();

/**
 * GET /api/v1/auth/providers
 * Lists all configured enterprise identity & SSO providers
 */
authRouter.get("/providers", (_req: Request, res: Response) => {
  const oauthStatus = oauthService.getStatus();
  const samlStatus = samlService.getStatus();

  res.json({
    success: true,
    providers: [
      {
        id: "google",
        name: "Google Workspace",
        type: "oauth2_oidc",
        enabled: true,
        loginUrl: "/api/v1/auth/google/login",
        hostedDomainEnforced: oauthStatus.google.hostedDomainEnforced,
      },
      {
        id: "github",
        name: "GitHub",
        type: "oauth2",
        enabled: true,
        loginUrl: "/api/v1/auth/github/login",
      },
      {
        id: "okta_saml",
        name: "Okta (SAML 2.0)",
        type: "saml2",
        enabled: true,
        loginUrl: "/api/v1/auth/okta/login",
        spMetadataUrl: "/api/v1/auth/saml/metadata",
        acsUrl: samlStatus.acsUrl,
      },
    ],
  });
});

/**
 * GET /api/v1/auth/saml/metadata
 * Exposes SP Metadata XML for Okta / Enterprise IdP configuration
 */
authRouter.get("/saml/metadata", (_req: Request, res: Response) => {
  const xml = samlService.generateSpMetadata();
  res.setHeader("Content-Type", "application/xml");
  res.send(xml);
});

/**
 * GET /api/v1/auth/:provider/login
 * Initiates SSO flow by generating IdP redirect URL
 */
authRouter.get("/:provider/login", (req: Request, res: Response) => {
  const { provider } = req.params;
  const state = (req.query.state as string) || "app_redirect";

  if (provider === "google") {
    const url = oauthService.getGoogleAuthUrl(state);
    return res.json({ success: true, provider: "google", redirectUrl: url });
  }

  if (provider === "github") {
    const url = oauthService.getGitHubAuthUrl(state);
    return res.json({ success: true, provider: "github", redirectUrl: url });
  }

  if (provider === "okta" || provider === "okta_saml" || provider === "saml") {
    const url = samlService.generateAuthnRequestUrl(state);
    return res.json({ success: true, provider: "okta_saml", redirectUrl: url });
  }

  return res.status(400).json({ success: false, error: `Unsupported provider: ${provider}` });
});

/**
 * GET /api/v1/auth/:provider/callback
 * Handles OAuth callback code exchange
 */
authRouter.get("/:provider/callback", async (req: Request, res: Response) => {
  const { provider } = req.params;
  const code = (req.query.code as string) || `mock_code_${Date.now()}`;
  const orgId = (req.query.orgId as string) || "org_apex_global";

  try {
    let profile;
    if (provider === "google") {
      profile = await oauthService.handleGoogleCallback(code);
    } else if (provider === "github") {
      profile = await oauthService.handleGitHubCallback(code);
    } else {
      return res.status(400).json({ success: false, error: `Unknown callback provider: ${provider}` });
    }

    const userId = `usr_${provider}_${profile.providerId.substring(0, 16)}`;
    const userRole: MembershipRole = "MEMBER";

    // Auto-provision membership in active org
    if (!dataStore.getMembership(orgId, userId)) {
      dataStore.addMembership(orgId, userId, userRole);
    }

    const token = signDevJwt({
      sub: userId,
      id: userId,
      email: profile.email,
      name: profile.name,
      orgId,
      roles: [userRole],
    });

    res.json({
      success: true,
      provider,
      token,
      tokenType: "Bearer",
      expiresInSeconds: 86400,
      user: {
        id: userId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        activeOrganizationId: orgId,
        roles: [userRole],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/auth/saml/acs
 * Receives SAMLResponse from Okta / IdP
 */
authRouter.post("/saml/acs", async (req: Request, res: Response) => {
  const samlResponse = req.body.SAMLResponse || Buffer.from("<mock>saml</mock>").toString("base64");
  const orgId = "org_apex_global";

  try {
    const profile = await samlService.processSamlResponse(samlResponse);
    const userId = `usr_saml_${Buffer.from(profile.email).toString("hex").substring(0, 12)}`;
    const userRole: MembershipRole = "REVIEWER";

    if (!dataStore.getMembership(orgId, userId)) {
      dataStore.addMembership(orgId, userId, userRole);
    }

    const token = signDevJwt({
      sub: userId,
      id: userId,
      email: profile.email,
      name: `${profile.firstName || "Enterprise"} ${profile.lastName || "User"}`,
      orgId,
      roles: [userRole],
    });

    res.json({
      success: true,
      provider: "okta_saml",
      token,
      tokenType: "Bearer",
      expiresInSeconds: 86400,
      user: {
        id: userId,
        email: profile.email,
        name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
        activeOrganizationId: orgId,
        roles: [userRole],
        groups: profile.groups,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/auth/me
 * Returns current authenticated user profile and active organization
 */
authRouter.get("/me", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }

  const org = dataStore.getOrganization(req.user.activeOrganizationId);
  const userMemberships = Array.from(dataStore.memberships.values()).filter(
    (m) => m.userId === req.user!.id
  );
  const userOrgs = userMemberships.map((m) => {
    const o = dataStore.getOrganization(m.organizationId);
    return {
      organizationId: m.organizationId,
      name: o ? o.name : m.organizationId,
      role: m.role,
    };
  });

  res.json({
    success: true,
    user: req.user,
    activeOrganization: org || { id: req.user.activeOrganizationId, name: "Unknown Organization" },
    availableOrganizations: userOrgs,
  });
});

/**
 * POST /api/v1/auth/dev-login
 * Issues a signed dev JWT for local testing and multi-tenant simulation
 */
authRouter.post("/dev-login", (req: Request, res: Response) => {
  const { userId, orgId, role } = req.body;
  const uid = userId || "usr_admin";
  const organizationId = orgId || "org_apex_global";
  const userRole: MembershipRole = role || "OWNER";

  // Ensure membership exists in store
  if (!dataStore.getMembership(organizationId, uid)) {
    dataStore.addMembership(organizationId, uid, userRole);
  }

  const token = signDevJwt({
    sub: uid,
    id: uid,
    email: `${uid}@platform.local`,
    name: uid === "usr_admin" ? "Alex Vance (Lead Architect)" : `User ${uid}`,
    orgId: organizationId,
    roles: [userRole],
  });

  res.json({
    success: true,
    token,
    tokenType: "Bearer",
    expiresInSeconds: 86400,
    user: {
      id: uid,
      email: `${uid}@platform.local`,
      activeOrganizationId: organizationId,
      roles: [userRole],
    },
  });
});
