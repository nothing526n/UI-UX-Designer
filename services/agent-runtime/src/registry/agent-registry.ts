import { AgentType, ArtifactType, ToolName, ModelTier } from "@platform/contracts";

export interface AgentDefinition {
  type: AgentType;
  version: string;
  title: string;
  description: string;
  defaultTier: ModelTier;
  inputArtifactTypes: ArtifactType[];
  outputArtifactType: ArtifactType;
  allowedTools: ToolName[];
}

export class AgentRegistry {
  private agents = new Map<AgentType, AgentDefinition>();

  constructor() {
    this.seedCanonicalAgents();
  }

  public register(def: AgentDefinition): void {
    this.agents.set(def.type, def);
  }

  public get(type: AgentType): AgentDefinition | undefined {
    return this.agents.get(type);
  }

  public list(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  private seedCanonicalAgents() {
    this.register({
      type: "REQUIREMENTS",
      version: "1.0.0",
      title: "Requirements Analyst Agent",
      description: "Translates high-level product ideas into structured product specs, user stories, and acceptance criteria.",
      defaultTier: "REASONING",
      inputArtifactTypes: [],
      outputArtifactType: "PRODUCT_SPEC",
      allowedTools: ["create_artifact", "search_project_knowledge"],
    });

    this.register({
      type: "UX_RESEARCH",
      version: "1.0.0",
      title: "UX Research & Journey Agent",
      description: "Creates primary/secondary personas, jobs-to-be-done, and customer journey maps.",
      defaultTier: "FAST",
      inputArtifactTypes: ["PRODUCT_SPEC"],
      outputArtifactType: "PERSONA",
      allowedTools: ["read_artifact", "create_artifact"],
    });

    this.register({
      type: "UX_DESIGNER",
      version: "1.0.0",
      title: "Information Architecture & Wireframe Agent",
      description: "Synthesizes route structures, user interaction flows, and wireframe artboards.",
      defaultTier: "REASONING",
      inputArtifactTypes: ["PRODUCT_SPEC", "PERSONA"],
      outputArtifactType: "WIREFRAME",
      allowedTools: ["read_artifact", "create_artifact"],
    });

    this.register({
      type: "DESIGN_SYSTEM",
      version: "1.0.0",
      title: "Design System Architect Agent",
      description: "Generates semantic token palettes, typography scales, radii, and component variants.",
      defaultTier: "FAST",
      inputArtifactTypes: ["PRODUCT_SPEC"],
      outputArtifactType: "DESIGN_SYSTEM",
      allowedTools: ["create_artifact", "read_artifact"],
    });

    this.register({
      type: "UI_DESIGNER",
      version: "1.0.0",
      title: "High-Fidelity UI Layout Agent",
      description: "Assembles complete responsive scene-graph ASTs styled with design system tokens.",
      defaultTier: "REASONING",
      inputArtifactTypes: ["PRODUCT_SPEC", "DESIGN_SYSTEM", "WIREFRAME"],
      outputArtifactType: "SCREEN",
      allowedTools: ["read_artifact", "create_artifact"],
    });

    this.register({
      type: "PROTOTYPE",
      version: "1.0.0",
      title: "Interaction & Hotspot Prototype Agent",
      description: "Connects screens with clickable hotspots, transitions, and state triggers.",
      defaultTier: "FAST",
      inputArtifactTypes: ["SCREEN"],
      outputArtifactType: "PROTOTYPE",
      allowedTools: ["read_artifact", "create_artifact"],
    });

    this.register({
      type: "FRONTEND_CODE",
      version: "1.0.0",
      title: "Production Frontend Code Agent",
      description: "Transpiles design scene graphs into production Next.js 14 App Router code with reviewable diffs.",
      defaultTier: "REASONING",
      inputArtifactTypes: ["SCREEN", "DESIGN_SYSTEM"],
      outputArtifactType: "CODE_SNAPSHOT",
      allowedTools: ["read_artifact", "write_code_snapshot"],
    });

    this.register({
      type: "VISUAL_QA",
      version: "1.0.0",
      title: "Quality Assurance & Verification Agent",
      description: "Performs multi-category audits across visual consistency, user flows, accessibility, and security.",
      defaultTier: "REASONING",
      inputArtifactTypes: ["SCREEN", "PROTOTYPE", "CODE_SNAPSHOT"],
      outputArtifactType: "QA_REPORT",
      allowedTools: ["read_artifact", "run_accessibility_check", "run_security_scan"],
    });
  }
}

export const agentRegistry = new AgentRegistry();
