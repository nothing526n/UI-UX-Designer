import { z } from "zod";

export const ArtifactTypeEnum = z.enum([
  "PRODUCT_SPEC",
  "PERSONA",
  "JOURNEY",
  "INFORMATION_ARCHITECTURE",
  "USER_FLOW",
  "WIREFRAME",
  "DESIGN_SYSTEM",
  "COMPONENT",
  "SCREEN",
  "PROTOTYPE",
  "PLATFORM_SPEC",
  "CODE_SNAPSHOT",
  "CODE_DIFF",
  "BUILD_REPORT",
  "QA_REPORT",
]);
export type ArtifactType = z.infer<typeof ArtifactTypeEnum>;

export const WorkflowStateEnum = z.enum([
  "INIT",
  "ANALYZING",
  "REQUIREMENTS_READY",
  "UX_DESIGNING",
  "UX_READY",
  "UI_DESIGNING",
  "UI_READY",
  "PROTOTYPE_READY",
  "GENERATING_CODE",
  "BUILDING",
  "PREVIEW_READY",
  "QA_RUNNING",
  "FIXING",
  "READY_FOR_APPROVAL",
  "APPROVED",
  "EXPORTED",
]);
export type WorkflowState = z.infer<typeof WorkflowStateEnum>;

export const OrgRoleEnum = z.enum([
  "OWNER",
  "ADMIN",
  "DESIGNER",
  "DEVELOPER",
  "VIEWER",
]);
export type OrgRole = z.infer<typeof OrgRoleEnum>;

export const TargetPlatformEnum = z.enum(["web", "desktop", "mobile", "all"]);
export type TargetPlatform = z.infer<typeof TargetPlatformEnum>;

export const ArtifactEnvelopeSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  artifactType: ArtifactTypeEnum,
  schemaVersion: z.string().default("1.0"),
  version: z.number().int().positive().default(1),
  parentArtifactId: z.string().nullable().optional(),
  branch: z.string().default("main"),
  status: z.enum(["draft", "committed", "deprecated"]).default("draft"),
  createdBy: z.string(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  content: z.union([z.record(z.any()), z.array(z.any())]),
  metadata: z.record(z.any()).optional(),
});
export type ArtifactEnvelope<T = Record<string, any>> = Omit<
  z.infer<typeof ArtifactEnvelopeSchema>,
  "content"
> & {
  content: T;
};

export const MembershipRoleEnum = z.enum([
  "OWNER",
  "ADMIN",
  "MEMBER",
  "REVIEWER",
  "VIEWER",
]);
export type MembershipRole = z.infer<typeof MembershipRoleEnum>;

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type OrganizationEntity = z.infer<typeof OrganizationSchema>;

export const OrganizationMembershipSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: MembershipRoleEnum,
  createdAt: z.string(),
});
export type OrganizationMembershipEntity = z.infer<typeof OrganizationMembershipSchema>;

export const AssetMetadataSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  sha256: z.string(),
  storagePath: z.string(),
  bucket: z.string().default("platform-assets"),
  uploadedBy: z.string(),
  createdAt: z.string(),
});
export type AssetMetadata = z.infer<typeof AssetMetadataSchema>;

export const AuditLogEntrySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string().optional(),
  actorId: z.string(),
  actorType: z.enum(["user", "agent", "system"]),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  timestamp: z.string(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

export const AuthUserContextSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  activeOrganizationId: z.string(),
  roles: z.array(MembershipRoleEnum),
});
export type AuthUserContext = z.infer<typeof AuthUserContextSchema>;

export const ArtifactEdgeSchema = z.object({
  id: z.string().optional(),
  sourceArtifactId: z.string(),
  targetArtifactId: z.string(),
  relationshipType: z.enum([
    "derived_from",
    "implements",
    "styles",
    "links_to",
    "tests",
    "fixes",
  ]),
});
export type ArtifactEdge = z.infer<typeof ArtifactEdgeSchema>;

