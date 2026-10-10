import { ToolName, ToolResult } from "@platform/contracts";

export interface ToolDefinition {
  name: ToolName;
  description: string;
  requiredPermission: string;
  allowedAgents: string[];
  handler: (args: Record<string, any>) => Promise<any>;
}

export class ToolRegistry {
  private tools = new Map<ToolName, ToolDefinition>();

  constructor() {
    this.registerDefaults();
  }

  public register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public get(name: ToolName): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public async execute(
    name: ToolName,
    args: Record<string, any>,
    agentType: string
  ): Promise<ToolResult> {
    const start = Date.now();
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolName: name,
        status: "error",
        error: `Tool '${name}' not found in registry.`,
        durationMs: Date.now() - start,
      };
    }

    if (!tool.allowedAgents.includes(agentType) && !tool.allowedAgents.includes("*")) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolName: name,
        status: "denied",
        error: `Agent '${agentType}' is not authorized to invoke tool '${name}'.`,
        durationMs: Date.now() - start,
      };
    }

    try {
      const output = await tool.handler(args);
      return {
        toolCallId: `call_${Date.now()}`,
        toolName: name,
        status: "success",
        output,
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolName: name,
        status: "error",
        error: err?.message || String(err),
        durationMs: Date.now() - start,
      };
    }
  }

  private registerDefaults(): void {
    this.register({
      name: "read_artifact",
      description: "Read an artifact by ID or type and version",
      requiredPermission: "read:artifact",
      allowedAgents: ["*"],
      handler: async (args) => ({ success: true, artifactId: args.artifactId }),
    });

    this.register({
      name: "create_artifact",
      description: "Persist a new versioned artifact",
      requiredPermission: "write:artifact",
      allowedAgents: ["*"],
      handler: async (args) => ({ success: true, createdId: `art_${Date.now()}` }),
    });

    this.register({
      name: "update_artifact",
      description: "Update an existing draft artifact",
      requiredPermission: "write:artifact",
      allowedAgents: ["*"],
      handler: async (args) => ({ success: true, updatedId: args.artifactId }),
    });

    this.register({
      name: "search_project_knowledge",
      description: "Search project rules, tokens, and previous design specs",
      requiredPermission: "read:knowledge",
      allowedAgents: ["*"],
      handler: async (args) => ({ query: args.query, results: [] }),
    });

    this.register({
      name: "read_asset_metadata",
      description: "Read metadata for an asset",
      requiredPermission: "read:asset",
      allowedAgents: ["UI_DESIGNER", "FRONTEND_CODE"],
      handler: async (args) => ({ assetId: args.assetId, mimeType: "image/svg+xml" }),
    });

    this.register({
      name: "generate_asset_request",
      description: "Request an icon or illustrative vector",
      requiredPermission: "write:asset",
      allowedAgents: ["UI_DESIGNER"],
      handler: async (args) => ({ assetRef: `asset_${args.name}` }),
    });

    this.register({
      name: "write_code_snapshot",
      description: "Materialize code snapshot files",
      requiredPermission: "write:code",
      allowedAgents: ["FRONTEND_CODE"],
      handler: async (args) => ({ snapshotId: `snap_${Date.now()}`, fileCount: args.files?.length || 0 }),
    });

    this.register({
      name: "run_build",
      description: "Trigger an isolated container build",
      requiredPermission: "execute:build",
      allowedAgents: ["FRONTEND_CODE", "ORCHESTRATOR"],
      handler: async (args) => ({ buildId: `bld_${Date.now()}`, status: "queued" }),
    });

    this.register({
      name: "render_preview",
      description: "Render application in browser preview sandbox",
      requiredPermission: "execute:preview",
      allowedAgents: ["ORCHESTRATOR", "VISUAL_QA"],
      handler: async (args) => ({ previewId: `prev_${Date.now()}`, url: `http://localhost:3000/preview` }),
    });

    this.register({
      name: "capture_screenshot",
      description: "Capture deterministic multi-viewport screenshots",
      requiredPermission: "execute:preview",
      allowedAgents: ["VISUAL_QA"],
      handler: async (args) => ({ screenshotUrl: `/screenshots/view_${args.viewport}.png` }),
    });

    this.register({
      name: "run_tests",
      description: "Run unit and integration test suite",
      requiredPermission: "execute:test",
      allowedAgents: ["TESTING", "QA_AGENT"],
      handler: async () => ({ passed: true, testCount: 14 }),
    });

    this.register({
      name: "run_accessibility_check",
      description: "Run automated axe-core accessibility scanner",
      requiredPermission: "execute:qa",
      allowedAgents: ["ACCESSIBILITY_QA", "QA_AGENT"],
      handler: async () => ({ violations: 1, score: 96 }),
    });

    this.register({
      name: "run_security_scan",
      description: "Run dependency vulnerability and secret exposure scan",
      requiredPermission: "execute:security",
      allowedAgents: ["SECURITY_QA", "QA_AGENT"],
      handler: async () => ({ clean: true, scannedFiles: 4 }),
    });

    this.register({
      name: "export_project",
      description: "Export project package archive",
      requiredPermission: "execute:export",
      allowedAgents: ["DOCUMENTATION", "ORCHESTRATOR"],
      handler: async (args) => ({ archiveUrl: `/exports/project_${args.projectId}.zip` }),
    });
  }
}
