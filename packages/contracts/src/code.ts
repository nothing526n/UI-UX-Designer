import { z } from "zod";

export const FileOwnershipEnum = z.enum(["generated", "user", "mixed"]);
export type FileOwnership = z.infer<typeof FileOwnershipEnum>;

export const GeneratedFileSchema = z.object({
  path: z.string(), // e.g. "app/dashboard/page.tsx"
  content: z.string(),
  language: z.string().default("typescript"),
  ownership: FileOwnershipEnum.default("generated"),
  sourceArtifactRef: z.string().optional(),
});
export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;

export const CodeSnapshotContentSchema = z.object({
  framework: z.enum(["nextjs", "react_vite"]).default("nextjs"),
  targetPlatform: z.enum(["web", "desktop", "mobile"]).default("web"),
  files: z.array(GeneratedFileSchema),
  entrypoint: z.string().default("app/page.tsx"),
  dependencies: z.record(z.string()).default({}),
  devDependencies: z.record(z.string()).default({}),
});
export type CodeSnapshotContent = z.infer<typeof CodeSnapshotContentSchema>;

export const FileDiffOperationEnum = z.enum(["CREATE", "UPDATE", "DELETE"]);
export type FileDiffOperation = z.infer<typeof FileDiffOperationEnum>;

export const FileDiffSchema = z.object({
  filePath: z.string(),
  operation: FileDiffOperationEnum,
  oldContent: z.string().optional(),
  newContent: z.string().optional(),
  unifiedDiff: z.string(),
});
export type FileDiff = z.infer<typeof FileDiffSchema>;

export const CodeDiffContentSchema = z.object({
  changeId: z.string(),
  summary: z.string(),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]).default("LOW"),
  diffs: z.array(FileDiffSchema),
  sourceArtifactRefs: z.array(z.string()).default([]),
});
export type CodeDiffContent = z.infer<typeof CodeDiffContentSchema>;
