/**
 * Phase 2 Integration Test Suite
 * Tests AI Platform Core:
 * - AI Agent Runs REST API (Dispatch, Telemetry, Approvals, Cancellation)
 * - Model Gateway & Multi-Provider Adapters
 * - Prompt Registry & Agent Capability Registry
 * - Typed Tool Registry Execution
 * - Semantic RAG Vector Store
 * - Golden Loop Orchestration & Regression Test Harness
 */

import http from "http";
import assert from "assert";
import { createServer } from "./dist/server.js";
import {
  AIOrchestrator,
  modelGateway,
  promptRegistry,
  agentRegistry,
  ToolRegistry,
  VectorStore,
  RegressionHarness,
} from "@platform/agent-runtime";

const app = createServer();
const server = http.createServer(app);

async function run() {
  console.log("\n==========================================");
  console.log("  RUNNING PHASE 2 INTEGRATION TESTS");
  console.log("==========================================\n");

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST] API Server listening on port ${port}`);

  try {
    // 1. Model Gateway & Provider Routing
    console.log("-> Testing Model Gateway & Provider Routing");
    const gatewayHealth = modelGateway.getTelemetry();
    assert(gatewayHealth.providerCallCounts.mock !== undefined, "Mock adapter must be tracked");
    assert(gatewayHealth.providerCallCounts.gemini !== undefined, "Gemini adapter must be tracked");
    assert(gatewayHealth.providerCallCounts.anthropic !== undefined, "Anthropic adapter must be tracked");
    assert(gatewayHealth.providerCallCounts.openai !== undefined, "OpenAI adapter must be tracked");

    // Execute canonical request via gateway
    const canonicalRes = await modelGateway.execute({
      model: "gemini-1.5-pro",
      tier: "REASONING",
      messages: [
        { role: "user", content: "Synthesize high-contrast dark theme tokens for logistics OS" },
      ],
      responseFormat: "json_schema",
    });
    assert(canonicalRes.text || canonicalRes.structuredOutput, "Gateway response must have text or structuredOutput");
    assert.strictEqual(canonicalRes.provider, "mock");
    assert(canonicalRes.usage.totalTokens > 0, "Usage metrics must track tokens");
    console.log("   ✓ Model Gateway executed canonical request with token tracking");

    // 2. Prompt & Agent Registries
    console.log("-> Testing Prompt & Agent Registries");
    const reqTmpl = promptRegistry.getTemplate("requirements-synthesis");
    assert(reqTmpl, "Must have requirements-synthesis template");
    assert(reqTmpl.templateString.includes("ProductSpec"), "Template must reference ProductSpec");

    const interpolated = promptRegistry.interpolate("requirements-synthesis", {
      prompt: "Build SaaS Fleet OS",
      targetPlatforms: "web",
    });
    assert(interpolated.includes("Build SaaS Fleet OS"), "Interpolation must substitute variable");

    const allAgents = agentRegistry.list();
    assert(allAgents.length >= 8, "Agent registry must contain at least 8 specialist agents");
    const uiAgent = agentRegistry.get("UI_DESIGNER");
    assert.strictEqual(uiAgent?.outputArtifactType, "SCREEN");
    console.log(`   ✓ Prompt & Agent registries verified (${allAgents.length} agents registered)`);

    // 3. Typed Tool Registry
    console.log("-> Testing Typed Tool Registry");
    const toolRegistry = new ToolRegistry();
    const readTool = toolRegistry.get("read_artifact");
    assert(readTool, "Tool registry must contain read_artifact");

    const toolRes = await toolRegistry.execute("read_artifact", {
      artifactId: "art_test_123",
    }, "UI_DESIGNER");
    assert.strictEqual(toolRes.status, "success");
    assert.strictEqual(toolRes.output.artifactId, "art_test_123");
    console.log("   ✓ Typed Tool Registry executed 'read_artifact' successfully");

    // 4. Semantic RAG Vector Store
    console.log("-> Testing Semantic RAG Vector Store");
    const vectorStore = new VectorStore(64);
    await vectorStore.addDocuments([
      {
        id: "doc_button",
        content: "Interactive primary button component with hover and focus states",
        metadata: { category: "component", tags: ["action", "ui"] },
      },
      {
        id: "doc_card",
        content: "Fleet dispatch telemetry metric card showing live truck GPS position",
        metadata: { category: "component", tags: ["telemetry", "data"] },
      },
      {
        id: "doc_req",
        content: "System shall notify dispatchers within 500ms of route deviation exception",
        metadata: { category: "requirement", tags: ["alert", "sla"] },
      },
    ]);

    assert.strictEqual(vectorStore.size(), 3);
    const searchResults = await vectorStore.search("fleet telemetry GPS position", { topK: 1 });
    assert.strictEqual(searchResults.length, 1);
    assert.strictEqual(searchResults[0].document.id, "doc_card");
    assert(searchResults[0].score > 0.4, "Relevant document must score high similarity");
    console.log(`   ✓ Semantic RAG Vector Store top match: '${searchResults[0].document.id}' (score: ${searchResults[0].score.toFixed(3)})`);

    // 5. AI Agent Runs REST API
    console.log("-> Testing AI Agent Runs API & Orchestrator");
    // Create test project via dev login
    const devLoginRes = await fetch(`${baseUrl}/api/v1/auth/dev-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "usr_agent_runner", orgId: "org_apex_global", role: "ADMIN" }),
    });
    const token = (await devLoginRes.json()).token;

    const projRes = await fetch(`${baseUrl}/api/v1/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Autonomous Logistics OS",
        targetPlatform: "web",
      }),
    });
    const projId = (await projRes.json()).project.id;

    // Trigger agent run
    const runRes = await fetch(`${baseUrl}/api/v1/projects/${projId}/agent-runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: "Build an automated route dispatch center with real-time exception handling",
      }),
    });
    assert.strictEqual(runRes.status, 200);
    const runJson = await runRes.json();
    assert.strictEqual(runJson.success, true);
    assert.strictEqual(runJson.state, "READY_FOR_APPROVAL");
    assert(runJson.artifacts.length >= 8, "Must generate full suite of artifacts");
    console.log(`   ✓ Agent run executed with ${runJson.artifacts.length} generated artifacts`);

    // 6. Automated Regression Test Harness Verification
    console.log("-> Testing Automated Regression Test Harness");
    const harness = new RegressionHarness();
    const regressionReport = await harness.runSuite();
    assert.strictEqual(regressionReport.passed, true, "Regression suite must pass");
    assert.strictEqual(regressionReport.passRatePercent, 100);
    assert.strictEqual(regressionReport.failedCases, 0);
    console.log(`   ✓ Regression Test Suite: ${regressionReport.passRatePercent}% pass rate across ${regressionReport.totalCases} golden benchmarks`);

    console.log("\n==========================================");
    console.log("  ALL PHASE 2 INTEGRATION TESTS PASSED ✅");
    console.log("==========================================\n");
    server.close();
    process.exit(0);
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error("\n❌ PHASE 2 TEST FAILURE:", err);
  server.close();
  process.exit(1);
});
