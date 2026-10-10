import { z } from "zod";

export const AgentTypeEnum = z.enum([
  "ORCHESTRATOR",
  "REQUIREMENTS",
  "UX_RESEARCH",
  "UX_DESIGNER",
  "UI_DESIGNER",
  "DESIGN_SYSTEM",
  "PROTOTYPE",
  "PLATFORM",
  "FRONTEND_CODE",
  "VISUAL_QA",
  "UX_QA",
  "ACCESSIBILITY_QA",
  "SECURITY_QA",
  "TESTING",
  "DOCUMENTATION",
]);
export type AgentType = z.infer<typeof AgentTypeEnum>;

export const ToolNameEnum = z.enum([
  "read_artifact",
  "create_artifact",
  "update_artifact",
  "search_project_knowledge",
  "read_asset_metadata",
  "generate_asset_request",
  "write_code_snapshot",
  "run_build",
  "render_preview",
  "capture_screenshot",
  "run_tests",
  "run_accessibility_check",
  "run_security_scan",
  "export_project",
]);
export type ToolName = z.infer<typeof ToolNameEnum>;

export const ToolCallSchema = z.object({
  id: z.string(),
  toolName: ToolNameEnum,
  arguments: z.record(z.any()),
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

export const ToolResultSchema = z.object({
  toolCallId: z.string(),
  toolName: ToolNameEnum,
  status: z.enum(["success", "error", "denied"]),
  output: z.any().optional(),
  error: z.string().optional(),
  durationMs: z.number().default(0),
});
export type ToolResult = z.infer<typeof ToolResultSchema>;

export const TaskStepStatusEnum = z.enum([
  "pending",
  "running",
  "completed",
  "needs_approval",
  "failed",
  "skipped",
]);
export type TaskStepStatus = z.infer<typeof TaskStepStatusEnum>;

export const TaskStepSchema = z.object({
  id: z.string(),
  assignedAgent: AgentTypeEnum,
  title: z.string(),
  description: z.string(),
  status: TaskStepStatusEnum.default("pending"),
  inputArtifactRefs: z.array(z.string()).default([]).optional(),
  outputArtifactType: z.string().optional(),
  outputArtifactId: z.string().optional(),
  error: z.string().optional(),
});
export type TaskStep = z.infer<typeof TaskStepSchema>;

export const TaskPlanSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  goal: z.string(),
  currentStepIndex: z.number().default(0),
  steps: z.array(TaskStepSchema),
  isPausedForApproval: z.boolean().default(false),
});
export type TaskPlan = z.infer<typeof TaskPlanSchema>;

export const AgentRunRecordSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  agentType: AgentTypeEnum,
  modelProvider: z.string(),
  modelName: z.string(),
  status: z.enum(["queued", "running", "completed", "failed", "cancelled"]),
  promptTokens: z.number().default(0),
  outputTokens: z.number().default(0),
  costUsd: z.number().default(0),
  durationMs: z.number().default(0),
  inputPrompt: z.string().optional(),
  responseOutput: z.string().optional(),
  toolCalls: z.array(ToolCallSchema).default([]),
  createdAt: z.string().optional(),
});
export type AgentRunRecord = z.infer<typeof AgentRunRecordSchema>;
