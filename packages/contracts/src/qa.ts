import { z } from "zod";

export const QACategoryEnum = z.enum([
  "visual",
  "ux",
  "accessibility",
  "security",
  "functional",
  "performance",
]);
export type QACategory = z.infer<typeof QACategoryEnum>;

export const QASeverityEnum = z.enum([
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "INFO",
]);
export type QASeverity = z.infer<typeof QASeverityEnum>;

export const QAEvidenceSchema = z.object({
  screenshotTargetUrl: z.string().optional(),
  screenshotActualUrl: z.string().optional(),
  screenshotDiffUrl: z.string().optional(),
  mismatchPercentage: z.number().optional(),
  wcagRule: z.string().optional(), // e.g. "color-contrast", "label"
  contrastRatio: z.string().optional(),
  filePath: z.string().optional(),
  lineRange: z.string().optional(),
  domSelector: z.string().optional(),
});
export type QAEvidence = z.infer<typeof QAEvidenceSchema>;

export const QAIssueSchema = z.object({
  id: z.string(),
  category: QACategoryEnum,
  severity: QASeverityEnum,
  title: z.string(),
  description: z.string(),
  targetRef: z.string(), // ID of Screen, Component, or Source File
  evidence: QAEvidenceSchema.optional(),
  suggestedFix: z.string(),
  remedyCode: z.string().optional(), // automated patch candidate
  status: z.enum(["open", "fixing", "resolved", "ignored"]).default("open"),
});
export type QAIssue = z.infer<typeof QAIssueSchema>;

export const QAReportContentSchema = z.object({
  runId: z.string(),
  buildId: z.string().optional(),
  targetScreenId: z.string().optional(),
  passed: z.boolean(),
  summary: z.object({
    total: z.number(),
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
  issues: z.array(QAIssueSchema),
});
export type QAReportContent = z.infer<typeof QAReportContentSchema>;
