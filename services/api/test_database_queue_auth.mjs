/**
 * Database, Queue & Authentication Subsystem Test Suite
 * Tests Platform Foundation subsystems:
 * - DatabaseService: connection telemetry, migration runner, constraint verification
 * - Live DB constraint enforcement: Tenant isolation & Artifact lineage validation
 * - DistributedQueueService: dual BullMQ/memory queue, job enqueuing & lifecycle
 * - OAuthService: Google & GitHub auth URL generation and profile callbacks
 * - SAMLService: Okta AuthnRequest, SP metadata XML, assertion processing
 * - RBAC & Tenant Isolation Middleware
 */

import assert from "assert";
import { databaseService, DatabaseConstraintError } from "./dist/db/database-service.js";
import { distributedQueueService } from "./dist/queue/distributed-queue.js";
import { oauthService } from "./dist/auth/oauth-service.js";
import { samlService } from "./dist/auth/saml-service.js";
import { requireRole, enforceTenantIsolation } from "./dist/middleware/rbac.js";
import { dataStore } from "./dist/store.js";

async function run() {
  console.log("\n========================================================");
  console.log("  RUNNING DATABASE, QUEUE & AUTH SUBSYSTEM TESTS");
  console.log("========================================================\n");

  // 1. Database Service & Telemetry
  console.log("-> Testing Database Service & Telemetry");
  const dbStatus = databaseService.getStatus();
  assert(dbStatus.type === "postgresql" || dbStatus.type === "in-memory-fast-path");
  assert(Array.isArray(dbStatus.migrationsApplied));
  console.log(`   ✓ Database status: ${dbStatus.status} (mode: ${dbStatus.type})`);

  // Run migrations
  const migrationResult = await databaseService.runMigrations();
  assert.strictEqual(migrationResult.success, true, "Migrations must succeed");
  assert(migrationResult.applied.length > 0, "At least one migration must be recorded");
  console.log(`   ✓ Migrations applied: ${migrationResult.applied.join(", ")}`);

  // Verify schema constraints
  const constraintCheck = await databaseService.verifySchemaConstraints();
  assert.strictEqual(constraintCheck.valid, true, "Schema constraints must be valid");
  console.log("   ✓ Schema constraints verified successfully");

  // 2. Tenant Isolation & Lineage Constraint Enforcement
  console.log("-> Testing Tenant Isolation & Lineage Constraints");
  // Seed sample project
  const sampleProject = dataStore.createProject(
    "Apex Telemetry",
    "Telemetry test",
    "web",
    "org_apex_global"
  );

  // Positive tenant isolation check
  const validTenant = await databaseService.validateTenantIsolation(
    "org_apex_global",
    sampleProject.id
  );
  assert.strictEqual(validTenant, true, "Valid organization must pass tenant check");

  // Negative tenant isolation check
  const invalidTenant = await databaseService.validateTenantIsolation(
    "org_different_corp",
    sampleProject.id
  );
  assert.strictEqual(invalidTenant, false, "Mismatched organization must fail tenant check");
  console.log("   ✓ Tenant isolation logic verified");

  // Artifact lineage validation
  const validRootLineage = await databaseService.validateArtifactLineage(sampleProject.id, undefined);
  assert.strictEqual(validRootLineage, true, "Root artifact (no parent) must be valid");

  const invalidParentLineage = await databaseService.validateArtifactLineage(
    sampleProject.id,
    "art_non_existent_parent"
  );
  assert.strictEqual(invalidParentLineage, false, "Non-existent parent must fail lineage check");
  console.log("   ✓ Artifact lineage integrity constraints verified");

  // 3. Distributed Queue & Job Lifecycle
  console.log("-> Testing Distributed Queue Service");
  const queueTelemetry = distributedQueueService.getTelemetry();
  assert(queueTelemetry.type === "redis-bullmq" || queueTelemetry.type === "in-memory-queue");
  assert(queueTelemetry.queues.length >= 3, "Must track at least 3 queues");
  console.log(`   ✓ Queue active in '${queueTelemetry.type}' mode`);

  // Enqueue agent task
  const agentJob = await distributedQueueService.enqueueAgentRun(
    sampleProject.id,
    "Synthesize Dispatcher UI",
    "FULL_PIPELINE"
  );
  assert(agentJob.id.startsWith("job_agent_"), "Job ID must be formatted");
  assert(agentJob.status === "queued" || agentJob.status === "completed" || agentJob.status === "active");

  // Enqueue build job
  const buildJob = await distributedQueueService.enqueueBuild(sampleProject.id, "art_code_v1");
  assert(buildJob.id.startsWith("job_build_"), "Build job ID must be formatted");

  // Enqueue QA evaluation job
  const qaJob = await distributedQueueService.enqueueQAEvaluation(sampleProject.id, "art_screen_v1");
  assert(qaJob.id.startsWith("job_qa_"), "QA job ID must be formatted");
  console.log(`   ✓ Enqueued 3 background tasks (Agent, Build, QA) successfully`);

  // 4. OAuth2 Service (Google & GitHub)
  console.log("-> Testing OAuth2 Service");
  const googleAuthUrl = oauthService.getGoogleAuthUrl("test_state_123");
  assert(googleAuthUrl.includes("accounts.google.com"), "Google URL must target Google OAuth");
  assert(googleAuthUrl.includes("state=test_state_123"), "URL must preserve state param");

  const githubAuthUrl = oauthService.getGitHubAuthUrl("test_state_456");
  assert(githubAuthUrl.includes("github.com/login/oauth"), "GitHub URL must target GitHub OAuth");
  assert(githubAuthUrl.includes("state=test_state_456"), "URL must preserve state param");

  // Test OAuth callback code exchange (mock mode in test environment)
  const googleProfile = await oauthService.handleGoogleCallback("mock_code_alpha");
  assert.strictEqual(googleProfile.provider, "google");
  assert(googleProfile.email.includes("@"), "Google profile must have valid email");

  const githubProfile = await oauthService.handleGitHubCallback("mock_code_beta");
  assert.strictEqual(githubProfile.provider, "github");
  assert(githubProfile.email.includes("@"), "GitHub profile must have valid email");
  console.log(`   ✓ OAuth2 flows verified for Google (${googleProfile.email}) and GitHub (${githubProfile.email})`);

  // 5. SAML 2.0 Service (Okta SSO)
  console.log("-> Testing SAML 2.0 Service");
  const samlStatus = samlService.getStatus();
  assert(samlStatus.spEntityId, "SP Entity ID must be present");
  assert(samlStatus.acsUrl.includes("/api/v1/auth/saml/acs"), "ACS URL must be configured");

  const authnRequestUrl = samlService.generateAuthnRequestUrl("saml_relay_state");
  assert(authnRequestUrl.includes("SAMLRequest="), "AuthnRequest must contain SAMLRequest payload");

  const spMetadataXml = samlService.generateSpMetadata();
  assert(spMetadataXml.includes("EntityDescriptor"), "SP Metadata must be valid XML");
  assert(spMetadataXml.includes("AssertionConsumerService"), "SP Metadata must define ACS endpoint");

  // Test SAML response assertion processing
  const samlProfile = await samlService.processSamlResponse(Buffer.from("<mock>assertion</mock>").toString("base64"));
  assert.strictEqual(samlProfile.provider, "okta_saml");
  assert(samlProfile.email.includes("@"), "SAML profile must have valid email");
  console.log(`   ✓ SAML 2.0 flows verified for Okta (${samlProfile.email})`);

  // 6. RBAC Middleware Enforcement
  console.log("-> Testing RBAC Middleware Enforcement");
  const mockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  // Test requireRole: should permit ADMIN
  let nextCalled = false;
  const adminReq = {
    user: { id: "usr_admin", email: "admin@test.com", activeOrganizationId: "org_1", roles: ["ADMIN"] },
  };
  const adminRes = mockRes();
  requireRole(["OWNER", "ADMIN"])(adminReq, adminRes, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true, "requireRole must pass when user has required role");

  // Test requireRole: should reject VIEWER when ADMIN required
  let deniedCalled = false;
  const viewerReq = {
    user: { id: "usr_viewer", email: "viewer@test.com", activeOrganizationId: "org_1", roles: ["VIEWER"] },
  };
  const viewerRes = mockRes();
  requireRole(["ADMIN"])(viewerReq, viewerRes, () => {
    deniedCalled = true;
  });
  assert.strictEqual(deniedCalled, false, "requireRole must block non-permitted role");
  assert.strictEqual(viewerRes.statusCode, 403, "Must return 403 FORBIDDEN");
  console.log("   ✓ RBAC role checks enforced (Admin passed, Viewer denied with 403)");

  console.log("\n========================================================");
  console.log("  ALL DATABASE, QUEUE & AUTH TESTS PASSED ✅");
  console.log("========================================================\n");

  process.exit(0);
}

run().catch((err) => {
  console.error("\n❌ DATABASE/QUEUE/AUTH TEST FAILURE:", err);
  process.exit(1);
});
