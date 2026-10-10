/**
 * Figma Model & Code Connect Integration Test Suite
 * Validates:
 * 1. Auto Layout Physics & Backward Compatibility Normalizer
 * 2. 3-Tier Variable Collections & Multi-Mode CSS Generation
 * 3. Code Connect Component Registry & TSX Code Generation
 * 4. DOM-to-AST Reverse Layout Compiler
 * 5. Figma Integration REST Endpoints (Import, Sync Variables, Schema Export)
 */

import http from "http";
import assert from "assert";
import { createServer } from "./dist/server.js";
import { dataStore } from "./dist/store.js";
import {
  CodeConnectRegistry,
  parseHtmlSnippetToAst,
} from "@platform/agent-runtime";
import {
  defaultVariableCollections,
  generateVariableCollectionCss,
} from "@platform/design-system";
import {
  normalizeToAutoLayout,
  LayoutModeEnum,
  SizingModeEnum,
} from "@platform/contracts";

const app = createServer();
const server = http.createServer(app);

async function run() {
  console.log("\n=======================================================");
  console.log("  RUNNING FIGMA MODEL & CODE CONNECT INTEGRATION TESTS");
  console.log("=======================================================");

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST] API Server listening on port ${port}`);

  try {
    // ----------------------------------------------------
    // 1. Auto Layout Physics & Normalizer
    // ----------------------------------------------------
    console.log("-> 1. Testing Auto Layout Physics & AST Normalization");
    const legacyNode = {
      id: "node_legacy_container",
      name: "Dashboard Card",
      type: "CONTAINER",
      position: { x: 10, y: 20, width: 400, height: 250 },
      children: [
        {
          id: "node_btn_fixed",
          name: "Submit Button Fixed",
          type: "BUTTON",
          position: { x: 15, y: 30, width: 120, height: 40 },
        },
        {
          id: "node_btn_hug",
          name: "Cancel Button Hug",
          type: "BUTTON",
        },
      ],
    };

    const normalized = normalizeToAutoLayout(legacyNode);
    assert(normalized.autoLayout !== undefined, "Node must have autoLayout property populated");
    assert.strictEqual(normalized.autoLayout.layoutMode, LayoutModeEnum.enum.VERTICAL);
    assert.strictEqual(normalized.autoLayout.primaryAxisSizingMode, SizingModeEnum.enum.FIXED);
    assert.strictEqual(normalized.autoLayout.counterAxisSizingMode, SizingModeEnum.enum.FIXED);
    assert(normalized.children && normalized.children.length === 2, "Children must be normalized");
    assert.strictEqual(normalized.children[0].autoLayout.primaryAxisSizingMode, SizingModeEnum.enum.FIXED);
    assert.strictEqual(normalized.children[1].autoLayout.primaryAxisSizingMode, SizingModeEnum.enum.AUTO);
    console.log("   ✓ Auto Layout normalization preserved hierarchy and assigned physics correctly");

    // ----------------------------------------------------
    // 2. Variable Collections & Multi-Mode Design Tokens
    // ----------------------------------------------------
    console.log("-> 2. Testing Variable Collections & Multi-Mode Token System");
    assert(Array.isArray(defaultVariableCollections), "defaultVariableCollections must be an array");
    assert.strictEqual(defaultVariableCollections.length, 2, "Must have 2 default collections (Brand & Foundations, Layout & Density)");

    const brandCol = defaultVariableCollections.find((c) => c.id === "col_brand_core");
    assert(brandCol, "Must have Brand & Foundations collection");
    assert.strictEqual(brandCol.modes.length, 2, "Brand tokens must have Dark and Light modes");
    assert(brandCol.variables.length >= 6, "Must define primitive and semantic color variables");

    const cssOutput = generateVariableCollectionCss(defaultVariableCollections);
    assert(cssOutput.includes(":root, [data-mode=\"mode_dark\"]"), "CSS must generate default root mode selector");
    assert(cssOutput.includes("[data-mode=\"mode_light\"]"), "CSS must generate light mode selector");
    assert(cssOutput.includes("[data-mode=\"mode_compact\"]"), "CSS must generate compact density mode selector");
    assert(cssOutput.includes("--accent-primary:"), "CSS must expose primary action color token");
    assert(cssOutput.includes("--bg-canvas:"), "CSS must expose canvas background token");
    console.log("   ✓ Variable collections verified with 3-tier resolution and multi-mode CSS variables");

    // ----------------------------------------------------
    // 3. Code Connect Component Registry
    // ----------------------------------------------------
    console.log("-> 3. Testing Code Connect Component Registry");
    const registry = new CodeConnectRegistry();
    const allMappings = registry.getAll();
    assert(allMappings.length >= 5, "Default registry must contain at least 5 canonical components (Button, Card, Badge, Input, Table)");

    const buttonMapping = registry.get("Button");
    assert(buttonMapping, "Button mapping must exist");
    assert.strictEqual(buttonMapping.componentName, "Button");
    assert.strictEqual(buttonMapping.importPath, "@/components/ui/button");
    assert(buttonMapping.propMappings.some((p) => p.codeProp === "variant"), "Button must define variant mapping");

    const tsxSnippet = registry.generateTsxSnippet("Button", {
      variant: "default",
      size: "lg",
      children: "Launch Deployment",
    });
    assert(tsxSnippet.includes('<Button variant="default" size="lg">Launch Deployment</Button>'), "Must generate valid JSX snippet");

    const manifest = registry.exportManifest();
    assert.strictEqual(manifest.version, "1.0.0");
    assert.strictEqual(manifest.mappings.length, allMappings.length, "Manifest must serialize all registered components");
    console.log(`   ✓ Code Connect registry validated (${allMappings.length} components, TSX generator, JSON manifest)`);

    // ----------------------------------------------------
    // 4. DOM-to-AST Reverse Compiler
    // ----------------------------------------------------
    console.log("-> 4. Testing DOM-to-AST Reverse Compiler");
    const sampleHtml = `
      <div class="rounded-xl" style="display: flex; flex-direction: column; gap: 16px; padding: 24px; width: 600px;">
        <h1 style="font-size: 24px;">Project Infrastructure</h1>
        <div style="display: flex; flex-direction: row; gap: 8px;">
          <button style="padding: 8px 16px; background-color: #2563eb; color: #fff;">Deploy</button>
          <button style="padding: 8px 16px; background-color: #64748b;">Cancel</button>
        </div>
      </div>
    `;

    const ast = parseHtmlSnippetToAst(sampleHtml);
    assert(ast.id, "AST must have an ID");
    assert(ast.autoLayout !== undefined, "AST root must have autoLayout properties");
    assert.strictEqual(ast.autoLayout.layoutMode, LayoutModeEnum.enum.VERTICAL);
    assert.strictEqual(ast.autoLayout.itemSpacing, 16);
    assert.strictEqual(ast.autoLayout.padding.top, 24);
    assert(ast.children && ast.children.length === 2, "Root node should have 2 children");
    console.log("   ✓ DOM-to-AST parsed HTML flex styles into high-fidelity Auto Layout AST");

    // ----------------------------------------------------
    // 5. Figma Integration REST API Endpoints
    // ----------------------------------------------------
    console.log("-> 5. Testing Figma Integration REST API Endpoints");

    // Setup mock project and screen in dataStore
    const testProject = dataStore.createProject(
      "Figma Gateway Validation",
      "Testing Figma endpoints",
      "web",
      "org_apex"
    );
    const screenArtifact = {
      id: "art_scr_101",
      projectId: testProject.id,
      artifactType: "SCREEN",
      version: 1,
      content: {
        screenId: "scr_101",
        title: "Dashboard Screen",
        route: "/dashboard",
        rootNode: {
          id: "node_root",
          name: "Root Shell",
          type: "frame",
          props: {},
          styles: {},
          autoLayout: { layoutMode: "VERTICAL", itemSpacing: 16 },
          children: [],
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dataStore.saveArtifact(screenArtifact);

    // 5.1 Import Figma File (Offline synthetic fixture)
    const importRes = await fetch(`${baseUrl}/api/v1/projects/${testProject.id}/figma/import-file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        figmaFileKey: "fig_sample_key",
      }),
    });
    assert.strictEqual(importRes.status, 200, "Import file endpoint must return 200");
    const importData = await importRes.json();
    assert(importData.success, "Response must indicate success");
    assert.strictEqual(importData.screens.length, 1, "Must convert Figma frames to screens");
    const importedScreen = importData.screens[0];
    assert.strictEqual(importedScreen.rootNode.autoLayout.layoutMode, LayoutModeEnum.enum.VERTICAL);
    assert.strictEqual(importedScreen.rootNode.autoLayout.itemSpacing, 16);
    console.log("   ✓ POST /figma/import-file successfully parsed and normalized Figma layout AST");

    // 5.2 Sync Figma Variables
    const syncRes = await fetch(`${baseUrl}/api/v1/projects/${testProject.id}/figma/sync-variables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        figmaFileKey: "fig_sample_key",
      }),
    });
    assert.strictEqual(syncRes.status, 200, "Sync variables endpoint must return 200");
    const syncData = await syncRes.json();
    assert(syncData.success, "Sync must succeed");
    assert(syncData.collections.length >= 1, "Must sync variable collections");
    assert(syncData.cssVariables.includes("--accent-primary:"), "Must synthesize CSS variables from synced tokens");
    console.log("   ✓ POST /figma/sync-variables mapped Figma token collections to CSS variables");

    // 5.3 Export Schema with Code Connect Metadata
    const exportRes = await fetch(`${baseUrl}/api/v1/projects/${testProject.id}/figma/export-schema/scr_101`);
    assert.strictEqual(exportRes.status, 200, "Export schema endpoint must return 200");
    const exportData = await exportRes.json();
    assert(exportData.screen, "Export must include screen AST");
    assert(exportData.codeConnectManifest, "Export must include Code Connect manifest");
    assert(exportData.variableCollections, "Export must include design system variable collections");
    console.log("   ✓ GET /figma/export-schema exported screen AST, Code Connect manifest, and variables");

    console.log("\n=======================================================");
    console.log("  ALL FIGMA MODEL & CODE CONNECT TESTS PASSED!");
    console.log("=======================================================\n");
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error("FATAL TEST ERROR:", err);
  process.exit(1);
});
