import {
  ArtifactEnvelope,
  ArtifactEdge,
  WorkflowState,
  AgentRunRecord,
  OrganizationEntity,
  OrganizationMembershipEntity,
  AssetMetadata,
  AuditLogEntry,
  MembershipRole,
} from "@platform/contracts";
import { AIOrchestrator } from "@platform/agent-runtime";

export interface ProjectEntity {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  targetPlatform: "web" | "desktop" | "mobile" | "all";
  currentState: WorkflowState;
  activeBranch: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuildEntity {
  id: string;
  projectId: string;
  status: "queued" | "building" | "success" | "failed";
  exitCode: number;
  logsText: string;
  bundleSizeKb: number;
  durationMs: number;
  createdAt: string;
}

export interface PreviewEntity {
  id: string;
  projectId: string;
  buildId: string;
  previewUrl: string;
  screenshotUrl: string;
  viewportMode: "desktop" | "tablet" | "mobile";
  createdAt: string;
}

export interface CommentEntity {
  id: string;
  projectId: string;
  artifactId?: string;
  author: string;
  targetType: "screen" | "component" | "canvas_pin" | "code_line";
  targetRef: string;
  content: string;
  resolved: boolean;
  createdAt: string;
}

export class DataStore {
  public organizations = new Map<string, OrganizationEntity>();
  public memberships = new Map<string, OrganizationMembershipEntity>();
  public projects = new Map<string, ProjectEntity>();
  public artifacts = new Map<string, ArtifactEnvelope>();
  public artifactEdges: ArtifactEdge[] = [];
  public agentRuns: AgentRunRecord[] = [];
  public assets = new Map<string, AssetMetadata>();
  public builds = new Map<string, BuildEntity>();
  public previews = new Map<string, PreviewEntity>();
  public comments: CommentEntity[] = [];
  public auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.seedDefaultProject();
  }

  // --- Organization & Membership Operations ---
  public getOrganization(id: string): OrganizationEntity | undefined {
    return this.organizations.get(id);
  }

  public listOrganizations(): OrganizationEntity[] {
    return Array.from(this.organizations.values());
  }

  public createOrganization(name: string, slug?: string): OrganizationEntity {
    const id = `org_${Date.now()}`;
    const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const org: OrganizationEntity = {
      id,
      name,
      slug: orgSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.organizations.set(id, org);
    return org;
  }

  public getMembership(organizationId: string, userId: string): OrganizationMembershipEntity | undefined {
    return this.memberships.get(`${organizationId}:${userId}`);
  }

  public listMemberships(organizationId: string): OrganizationMembershipEntity[] {
    return Array.from(this.memberships.values()).filter((m) => m.organizationId === organizationId);
  }

  public addMembership(organizationId: string, userId: string, role: MembershipRole): OrganizationMembershipEntity {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const membership: OrganizationMembershipEntity = {
      id,
      organizationId,
      userId,
      role,
      createdAt: new Date().toISOString(),
    };
    this.memberships.set(`${organizationId}:${userId}`, membership);
    return membership;
  }

  // --- Project Operations ---
  public getProject(id: string): ProjectEntity | undefined {
    return this.projects.get(id);
  }

  public listProjects(organizationId?: string): ProjectEntity[] {
    let list = Array.from(this.projects.values());
    if (organizationId) {
      list = list.filter((p) => p.organizationId === organizationId);
    }
    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public createProject(
    name: string,
    description: string,
    targetPlatform: "web" | "desktop" | "mobile" | "all" = "web",
    organizationId: string = "org_apex_global"
  ): ProjectEntity {
    const id = `proj_${Date.now()}`;
    const project: ProjectEntity = {
      id,
      organizationId,
      name,
      description,
      targetPlatform,
      currentState: "INIT",
      activeBranch: "main",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(id, project);
    return project;
  }

  public updateProjectState(id: string, state: WorkflowState): ProjectEntity | undefined {
    const proj = this.projects.get(id);
    if (proj) {
      proj.currentState = state;
      proj.updatedAt = new Date().toISOString();
      return proj;
    }
    return undefined;
  }

  // --- Artifact Operations ---
  public getArtifact(id: string): ArtifactEnvelope | undefined {
    return this.artifacts.get(id);
  }

  public listArtifacts(projectId: string): ArtifactEnvelope[] {
    return Array.from(this.artifacts.values()).filter(
      (a) => a.projectId === projectId
    );
  }

  public saveArtifact(artifact: ArtifactEnvelope): void {
    this.artifacts.set(artifact.id, artifact);
  }

  public commitArtifact(id: string): ArtifactEnvelope | undefined {
    const artifact = this.artifacts.get(id);
    if (artifact) {
      artifact.status = "committed";
      artifact.updatedAt = new Date().toISOString();
      return artifact;
    }
    return undefined;
  }

  public rollbackArtifact(id: string): ArtifactEnvelope | undefined {
    const historical = this.artifacts.get(id);
    if (!historical) return undefined;

    // Non-destructive rollback: creates new version pointing back to historical
    const newVersion = historical.version + 1;
    const rolledBack: ArtifactEnvelope = {
      ...historical,
      id: `art_rb_${Date.now()}`,
      version: newVersion,
      parentArtifactId: historical.id,
      status: "committed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...historical.metadata,
        rolledBackFrom: historical.id,
      },
    };
    this.saveArtifact(rolledBack);
    return rolledBack;
  }

  // --- Asset Operations ---
  public getAsset(id: string): AssetMetadata | undefined {
    return this.assets.get(id);
  }

  public listAssets(projectId: string): AssetMetadata[] {
    return Array.from(this.assets.values()).filter((a) => a.projectId === projectId);
  }

  public saveAsset(asset: AssetMetadata): void {
    this.assets.set(asset.id, asset);
  }

  // --- Audit Log Operations ---
  public recordAuditLog(entry: AuditLogEntry): void {
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop(); // Keep last 500 entries
    }
  }

  public listAuditLogs(organizationId?: string, projectId?: string): AuditLogEntry[] {
    return this.auditLogs.filter((l) => {
      if (organizationId && l.organizationId !== organizationId) return false;
      if (projectId && l.projectId !== projectId) return false;
      return true;
    });
  }

  // --- Seed Initial Data ---
  private async seedDefaultProject() {
    // 1. Seed Organization
    const defaultOrgId = "org_apex_global";
    this.organizations.set(defaultOrgId, {
      id: defaultOrgId,
      name: "Apex Global Logistics Inc.",
      slug: "apex-global-logistics",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Seed Membership
    this.memberships.set(`${defaultOrgId}:usr_admin`, {
      id: "mem_seed_001",
      organizationId: defaultOrgId,
      userId: "usr_admin",
      role: "OWNER",
      createdAt: new Date().toISOString(),
    });

    // 3. Seed Project
    const defaultProjId = "proj_apex_logistics";
    const project: ProjectEntity = {
      id: defaultProjId,
      organizationId: defaultOrgId,
      name: "Apex Logistics OS",
      description: "Autonomous Freight Dispatch, Telemetry & Exception Command Center",
      targetPlatform: "web",
      currentState: "READY_FOR_APPROVAL",
      activeBranch: "main",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(defaultProjId, project);

    // 4. Pre-populate with golden loop artifacts
    const orchestrator = new AIOrchestrator();
    const result = await orchestrator.executeGoldenLoop(
      defaultProjId,
      "SaaS Freight & Logistics Command Center with live telemetry, dispatch pipeline, and exception triage"
    );

    for (const art of result.artifacts) {
      this.artifacts.set(art.id, art);
    }

    // 5. Seed mock build & preview
    const buildId = "bld_seed_001";
    this.builds.set(buildId, {
      id: buildId,
      projectId: defaultProjId,
      status: "success",
      exitCode: 0,
      logsText: `[12:00:01] ▲ Next.js 14.2.5\n[12:00:02]   - Environments: .env\n[12:00:03] ✓ Compiled successfully in 1,280ms\n[12:00:04] ✓ Typechecking passed without errors (0 errors)\n[12:00:05] ✓ Generating static pages (5/5)\n[12:00:06] ○ Ready on http://localhost:3000`,
      bundleSizeKb: 142,
      durationMs: 1450,
      createdAt: new Date().toISOString(),
    });

    this.previews.set("prev_seed_001", {
      id: "prev_seed_001",
      projectId: defaultProjId,
      buildId,
      previewUrl: "http://localhost:3000/preview",
      screenshotUrl: "/screenshots/preview_desktop.png",
      viewportMode: "desktop",
      createdAt: new Date().toISOString(),
    });

    // 6. Seed sample comment
    this.comments.push({
      id: "comm_001",
      projectId: defaultProjId,
      artifactId: result.artifacts.find((a) => a.artifactType === "SCREEN")?.id,
      author: "Alex Rivera (Lead Designer)",
      targetType: "canvas_pin",
      targetRef: "node_kpi_grid",
      content: "The active exceptions metric card looks crisp. Let's make sure the filter chip matches the badge styling.",
      resolved: false,
      createdAt: new Date().toISOString(),
    });

    // 7. Seed initial audit log
    this.recordAuditLog({
      id: "audit_seed_001",
      organizationId: defaultOrgId,
      projectId: defaultProjId,
      actorId: "usr_admin",
      actorType: "user",
      action: "PROJECT_INITIALIZED",
      resourceType: "project",
      resourceId: defaultProjId,
      metadata: { seed: true },
      timestamp: new Date().toISOString(),
    });
  }
}

export const dataStore = new DataStore();
