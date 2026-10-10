import { z } from "zod";
import { ToolCallSchema } from "./agent.js";

export const ModelProviderTypeEnum = z.enum(["gemini", "anthropic", "openai", "mock"]);
export type ModelProviderType = z.infer<typeof ModelProviderTypeEnum>;

export const ModelTierEnum = z.enum(["FAST", "REASONING"]);
export type ModelTier = z.infer<typeof ModelTierEnum>;

export const MessageRoleEnum = z.enum(["system", "user", "assistant"]);
export type MessageRole = z.infer<typeof MessageRoleEnum>;

export const CanonicalModelMessageSchema = z.object({
  role: MessageRoleEnum,
  content: z.string(),
});
export type CanonicalModelMessage = z.infer<typeof CanonicalModelMessageSchema>;

export const CanonicalModelRequestSchema = z.object({
  model: z.string().default("gemini-1.5-pro"),
  tier: ModelTierEnum.default("REASONING"),
  provider: ModelProviderTypeEnum.optional(),
  messages: z.array(CanonicalModelMessageSchema),
  responseFormat: z.enum(["text", "json_object", "json_schema"]).default("json_schema"),
  jsonSchema: z.record(z.any()).optional(),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().positive().default(4096),
  tools: z.array(z.any()).optional(),
  toolChoice: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
export type CanonicalModelRequest = z.infer<typeof CanonicalModelRequestSchema>;

export const ModelUsageSchema = z.object({
  promptTokens: z.number().default(0),
  outputTokens: z.number().default(0),
  totalTokens: z.number().default(0),
  costEstimateUsd: z.number().default(0),
});
export type ModelUsage = z.infer<typeof ModelUsageSchema>;

export const CanonicalModelResponseSchema = z.object({
  id: z.string(),
  provider: ModelProviderTypeEnum,
  model: z.string(),
  finishReason: z.enum(["stop", "length", "tool_calls", "content_filter", "error"]),
  text: z.string(),
  structuredOutput: z.record(z.any()).optional(),
  toolCalls: z.array(ToolCallSchema).optional(),
  usage: ModelUsageSchema,
  latencyMs: z.number().default(0),
});
export type CanonicalModelResponse = z.infer<typeof CanonicalModelResponseSchema>;

export const ModelPolicySchema = z.object({
  tier: ModelTierEnum,
  preferredProvider: ModelProviderTypeEnum,
  fallbackProviders: z.array(ModelProviderTypeEnum),
  maxTokens: z.number().default(4096),
  temperature: z.number().default(0.2),
  timeoutMs: z.number().default(45000),
});
export type ModelPolicy = z.infer<typeof ModelPolicySchema>;
