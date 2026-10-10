import { z } from "zod";

export const FeaturePriorityEnum = z.enum(["P0", "P1", "P2"]);
export type FeaturePriority = z.infer<typeof FeaturePriorityEnum>;

export const ActorSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  description: z.string(),
  goals: z.array(z.string()),
  painPoints: z.array(z.string()),
});
export type Actor = z.infer<typeof ActorSchema>;

export const FeatureSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: FeaturePriorityEnum,
  acceptanceCriteria: z.array(z.string()),
  dependencies: z.array(z.string()).default([]),
  suggestedRoutes: z.array(z.string()).default([]),
});
export type Feature = z.infer<typeof FeatureSchema>;

export const ConstraintSchema = z.object({
  id: z.string(),
  type: z.enum(["technical", "business", "compliance", "accessibility", "platform"]),
  description: z.string(),
});
export type Constraint = z.infer<typeof ConstraintSchema>;

export const AssumptionSchema = z.object({
  id: z.string(),
  description: z.string(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  verifiedByHuman: z.boolean().default(false),
});
export type Assumption = z.infer<typeof AssumptionSchema>;

export const OpenQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  impact: z.enum(["HIGH", "MEDIUM", "LOW"]),
  status: z.enum(["open", "resolved", "ignored"]).default("open"),
  suggestedAnswer: z.string().optional(),
  resolvedAnswer: z.string().optional(),
});
export type OpenQuestion = z.infer<typeof OpenQuestionSchema>;

export const ProductSpecContentSchema = z.object({
  title: z.string(),
  summary: z.string(),
  vision: z.string(),
  targetPlatforms: z.array(z.string()).default(["web"]),
  actors: z.array(ActorSchema),
  features: z.array(FeatureSchema),
  constraints: z.array(ConstraintSchema).default([]),
  assumptions: z.array(AssumptionSchema).default([]),
  openQuestions: z.array(OpenQuestionSchema).default([]),
});
export type ProductSpecContent = z.infer<typeof ProductSpecContentSchema>;
