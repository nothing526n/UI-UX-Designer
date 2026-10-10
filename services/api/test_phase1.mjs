/**
 * Phase 1 Integration Test Suite
 * Tests Platform Foundation:
 * - Server lifecycle and health telemetry
 * - Authentication & JWT session verification
 * - Organizations & Tenant Isolation
 * - Projects CRUD
 * - Artifact Service & Immutable Lineage
 * - Assets storage & presigned upload URLs
 * - Realtime SSE Event Bus
 */

import http from "http";
import assert from "assert";
import { createServer } from "./dist/server.js";
import { signDevJwt } from "./dist/middleware/auth.js";
import { dataStore } from "./dist/store.js";

const app = createServer();
const server = http.createServer(app);

async function run() {
  console.log("\n==========================================");
  console.log("  RUNNING PHASE 1 INTEGRATION TESTS");
  console.log("==========================================\n");

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST] API Server listening on port ${port}`);

  try {
    // 1. Health & Subsystem Telemetry
    console.log("-> Testing GET /health");
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200, "Health check must return 200");
    const healthJson = await healthRes.json();
    assert.strictEqual(healthJson.status, "healthy");
    assert.strictEqual(healthJson.service, "@platform/api");
    assert(healthJson.subsystems.store, "Subsystems telemetry must include store");
    assert(healthJson.subsystems.database, "Subsystems telemetry must include database");
    assert(healthJson.subsystems.queue, "Subsystems telemetry must include queue");
    console.log("   ✓ Health check passed with active subsystems telemetry");

    // 2. Authentication & JWT Tokens
    console.log("-> Testing Auth & JWT Sessions");
    const devLoginRes = await fetch(`${baseUrl}/api/v1/auth/dev-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_tester",
        orgId: "org_apex_global",
        role: "ADMIN",
      }),
    });
    assert.strictEqual(devLoginRes.status, 200, "dev-login must return 200");
    const devLoginJson = await devLoginRes.json();
    assert(devLoginJson.token, "dev-login must return token");
    const testJwt = devLoginJson.token;

    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${testJwt}` },
    });
    assert.strictEqual(meRes.status, 200, "Auth me must return 200");
    const meJson = await meRes.json();
    assert.strictEqual(meJson.success, true);
    assert.strictEqual(meJson.user.id, "usr_tester");
    assert.strictEqual(meJson.user.activeOrganizationId, "org_apex_global");
    console.log("   ✓ JWT session & /api/v1/auth/me verified successfully");

    // 3. Organizations Management
    console.log("-> Testing Organizations API");
    const orgsRes = await fetch(`${baseUrl}/api/v1/orgs`, {
      headers: { Authorization: `Bearer ${testJwt}` },
    });
    assert.strictEqual(orgsRes.status, 200);
    const orgsJson = await orgsRes.json();
    assert(Array.isArray(orgsJson.organizations), "Organizations must return array");

    const newOrgRes = await fetch(`${baseUrl}/api/v1/orgs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testJwt}`,
      },
      body: JSON.stringify({
        name: "Acme Logistics Global",
        slug: `acme-logistics-${Date.now()}`,
      }),
    });
    assert.strictEqual(newOrgRes.status, 201);
    const newOrgJson = await newOrgRes.json();
    const createdOrgId = newOrgJson.organization.id;
    assert(createdOrgId, "Created org must have ID");
    console.log(`   ✓ Organization created: ${createdOrgId}`);

    // 4. Projects & Tenant Isolation
    console.log("-> Testing Projects & Tenant Isolation");
    const orgTokenRes = await fetch(`${baseUrl}/api/v1/auth/dev-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_tester",
        orgId: createdOrgId,
        role: "ADMIN",
      }),
    });
    const orgJwt = (await orgTokenRes.json()).token;

    const newProjectRes = await fetch(`${baseUrl}/api/v1/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orgJwt}`,
      },
      body: JSON.stringify({
        name: "Fleet Telemetry Hub",
        description: "Phase 1 verification project",
        targetPlatform: "web",
        organizationId: createdOrgId,
      }),
    });
    assert.strictEqual(newProjectRes.status, 201);
    const newProjectJson = await newProjectRes.json();
    const projectId = newProjectJson.project.id;
    assert.strictEqual(newProjectJson.project.organizationId, createdOrgId);
    console.log(`   ✓ Project created: ${projectId} in Org ${createdOrgId}`);

    // Verify Project Retrieval with valid tenant JWT
    const getProjectRes = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${orgJwt}` },
    });
    assert.strictEqual(getProjectRes.status, 200);

    // Verify Tenant Isolation Rejection with mismatched tenant JWT
    const crossTenantRes = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${testJwt}` }, // testJwt belongs to org_apex_global
    });
    assert.strictEqual(crossTenantRes.status, 403, "Cross-tenant access must be rejected with 403");
    console.log("   ✓ Tenant isolation verified: Cross-tenant access forbidden (403)");

    // 5. Artifact Service & Immutable Lineage
    console.log("-> Testing Artifact Service & Lineage");
    const rootArtifactRes = await fetch(`${baseUrl}/api/v1/projects/${projectId}/artifacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orgJwt}`,
      },
      body: JSON.stringify({
        artifactType: "PRODUCT_SPEC",
        schemaVersion: "1.0",
        version: 1,
        branch: "main",
        status: "draft",
        createdBy: "usr_tester",
        content: { title: "Fleet Management PRD", version: "1.0" },
      }),
    });
    assert.strictEqual(rootArtifactRes.status, 201);
    const rootArtifact = (await rootArtifactRes.json()).artifact;
    assert(rootArtifact.id, "Root artifact must have ID");

    // Create child artifact referencing parent lineage
    const childArtifactRes = await fetch(`${baseUrl}/api/v1/projects/${projectId}/artifacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orgJwt}`,
      },
      body: JSON.stringify({
        artifactType: "SCREEN",
        schemaVersion: "1.0",
        version: 2,
        parentArtifactId: rootArtifact.id,
        branch: "main",
        status: "draft",
        createdBy: "usr_tester",
        content: { screenId: "dashboard", name: "Dispatcher View" },
      }),
    });
    assert.strictEqual(childArtifactRes.status, 201);
    const childArtifact = (await childArtifactRes.json()).artifact;
    assert.strictEqual(childArtifact.parentArtifactId, rootArtifact.id);

    // Commit artifact
    const commitRes = await fetch(`${baseUrl}/api/v1/artifacts/${childArtifact.id}/commit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${orgJwt}` },
    });
    assert.strictEqual(commitRes.status, 200);
    const committedArtifact = (await commitRes.json()).artifact;
    assert.strictEqual(committedArtifact.status, "committed");
    console.log("   ✓ Immutable lineage & artifact commit verified");

    // 6. Assets Storage & Presigned URLs
    console.log("-> Testing Assets Presigned URL Generation");
    const assetPresignRes = await fetch(`${baseUrl}/api/v1/projects/${projectId}/assets/presigned-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orgJwt}`,
      },
      body: JSON.stringify({
        fileName: "truck_telemetry_icon.svg",
        mimeType: "image/svg+xml",
        sizeBytes: 4096,
      }),
    });
    assert.strictEqual(assetPresignRes.status, 201);
    const assetPresignJson = await assetPresignRes.json();
    assert(assetPresignJson.upload.uploadUrl, "Presigned response must contain uploadUrl");
    assert(assetPresignJson.upload.assetId, "Presigned response must contain assetId");
    assert(assetPresignJson.upload.uploadToken, "Presigned response must contain uploadToken");
    console.log("   ✓ Asset presigned upload URL generated successfully");

    // 7. Realtime SSE Event Stream
    console.log("-> Testing Realtime SSE Event Stream");
    const sseRes = await fetch(`${baseUrl}/api/v1/projects/${projectId}/events`, {
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${orgJwt}`,
      },
    });
    assert.strictEqual(sseRes.status, 200);
    const contentType = sseRes.headers.get("content-type") || "";
    assert(contentType.includes("text/event-stream"), "Must be text/event-stream");
    await sseRes.body?.cancel();
    console.log("   ✓ SSE event stream connected successfully");

    // 8. Project Approval API (Mobile / Lead Sign-off)
    console.log("-> Testing Project Approval & Tenant Enforcement");
    // Cross-tenant approval rejection
    const badApproveRes = await fetch(`${baseUrl}/api/v1/projects/${projectId}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${testJwt}` },
    });
    assert.strictEqual(badApproveRes.status, 403, "Cross-tenant approve must return 403");

    // Valid tenant approval
    const approveRes = await fetch(`${baseUrl}/api/v1/projects/${projectId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orgJwt}`,
      },
    });
    assert.strictEqual(approveRes.status, 200);
    const approveJson = await approveRes.json();
    assert.strictEqual(approveJson.success, true);
    assert.strictEqual(approveJson.project.currentState, "APPROVED");
    console.log("   ✓ Project approval signed and state set to APPROVED");

    console.log("\n==========================================");
    console.log("  ALL PHASE 1 INTEGRATION TESTS PASSED ✅");
    console.log("==========================================\n");
  } finally {
    server.close();
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("\n❌ PHASE 1 TEST FAILURE:", err);
  server.close();
  process.exit(1);
});
