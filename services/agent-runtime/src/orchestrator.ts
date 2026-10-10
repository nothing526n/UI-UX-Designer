import {
  WorkflowState,
  TaskPlan,
  ArtifactEnvelope,
  ProductSpecContent,
  PersonaContent,
  JourneyContent,
  InformationArchitectureContent,
  UserFlowContent,
  WireframeContent,
  DesignSystemContent,
  ScreenContent,
  PrototypeContent,
  CodeSnapshotContent,
  CodeDiffContent,
  QAReportContent,
  RealtimeEventType,
} from "@platform/contracts";

import { RequirementsAgent } from "./agents/requirements-agent.js";
import { UXResearchAgent } from "./agents/ux-research-agent.js";
import { UXDesignerAgent } from "./agents/ux-designer-agent.js";
import { DesignSystemAgent } from "./agents/design-system-agent.js";
import { UIDesignerAgent } from "./agents/ui-designer-agent.js";
import { PrototypeAgent } from "./agents/prototype-agent.js";
import { FrontendCodeAgent } from "./agents/frontend-code-agent.js";
import { QAAgent } from "./agents/qa-agent.js";
import { ToolRegistry } from "./tools/tool-registry.js";
import { modelGateway, ModelGateway } from "./gateway/model-gateway.js";
import { promptRegistry, PromptRegistry } from "./registry/prompt-registry.js";
import { agentRegistry, AgentRegistry } from "./registry/agent-registry.js";
import { contextBuilder, ContextBuilder } from "./context/context-builder.js";

export type EventListener = (type: RealtimeEventType, payload: Record<string, any>) => void;

export interface RunSession {
  planId: string;
  projectId: string;
  plan: TaskPlan;
  abortController: AbortController;
  isPaused: boolean;
  artifacts: ArtifactEnvelope[];
}

export class AIOrchestrator {
  private requirementsAgent = new RequirementsAgent();
  private uxResearchAgent = new UXResearchAgent();
  private uxDesignerAgent = new UXDesignerAgent();
  private designSystemAgent = new DesignSystemAgent();
  private uiDesignerAgent = new UIDesignerAgent();
  private prototypeAgent = new PrototypeAgent();
  private codeAgent = new FrontendCodeAgent();
  private qaAgent = new QAAgent();

  public toolRegistry = new ToolRegistry();
  public modelGateway: ModelGateway = modelGateway;
  public promptRegistry: PromptRegistry = promptRegistry;
  public agentRegistry: AgentRegistry = agentRegistry;
  public contextBuilder: ContextBuilder = contextBuilder;

  private listeners: EventListener[] = [];
  private activeRuns = new Map<string, RunSession>();

  public subscribe(fn: EventListener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(type: RealtimeEventType, payload: Record<string, any>): void {
    for (const listener of this.listeners) {
      try {
        listener(type, payload);
      } catch (err) {
        console.error("Error in event listener:", err);
      }
    }
  }

  public getRun(planId: string): RunSession | undefined {
    return this.activeRuns.get(planId);
  }

  public cancelRun(planId: string): boolean {
    const session = this.activeRuns.get(planId);
    if (!session) return false;
    session.abortController.abort();
    session.plan.steps[session.plan.currentStepIndex].status = "failed";
    session.plan.steps[session.plan.currentStepIndex].error = "Execution cancelled by user";
    this.emit("agent.failed", { projectId: session.projectId, step: session.plan.steps[session.plan.currentStepIndex] });
    return true;
  }

  public approveRun(planId: string): boolean {
    const session = this.activeRuns.get(planId);
    if (!session || !session.isPaused) return false;
    session.isPaused = false;
    session.plan.isPausedForApproval = false;
    return true;
  }

  /**
   * Execute the end-to-end multi-agent generation loop for a project prompt
   */
  public async executeGoldenLoop(
    projectId: string,
    prompt: string,
    options?: { signal?: AbortSignal; startStepIndex?: number }
  ): Promise<{
    state: WorkflowState;
    plan: TaskPlan;
    artifacts: ArtifactEnvelope[];
  }> {
    const artifacts: ArtifactEnvelope[] = [];
    const planId = `plan_${Date.now()}`;
    const abortController = new AbortController();

    // Link external signal if provided
    if (options?.signal) {
      options.signal.addEventListener("abort", () => abortController.abort());
    }

    const plan: TaskPlan = {
      id: planId,
      projectId,
      goal: prompt,
      currentStepIndex: 0,
      isPausedForApproval: false,
      steps: [
        {
          id: "step_1",
          assignedAgent: "REQUIREMENTS",
          title: "Synthesize Product Requirements",
          description: "Extract features, actors, acceptance criteria, and constraints from prompt",
          status: "pending",
        },
        {
          id: "step_2",
          assignedAgent: "UX_RESEARCH",
          title: "Conduct UX Research & Journeys",
          description: "Generate personas, jobs-to-be-done, and triage journeys",
          status: "pending",
        },
        {
          id: "step_3",
          assignedAgent: "UX_DESIGNER",
          title: "Information Architecture & User Flows",
          description: "Design route hierarchy, interaction graph, and low-fidelity wireframes",
          status: "pending",
        },
        {
          id: "step_4",
          assignedAgent: "DESIGN_SYSTEM",
          title: "Establish Semantic Design Tokens & Components",
          description: "Define dark-first palette, typography scales, radii, and component variants",
          status: "pending",
        },
        {
          id: "step_5",
          assignedAgent: "UI_DESIGNER",
          title: "Generate High-Fidelity Screens",
          description: "Produce component layout trees, auto-layout rows, and responsive artboards",
          status: "pending",
        },
        {
          id: "step_6",
          assignedAgent: "PROTOTYPE",
          title: "Compile Interactive Prototype Graph",
          description: "Bind hotspot triggers, screen transitions, and device mockup player",
          status: "pending",
        },
        {
          id: "step_7",
          assignedAgent: "FRONTEND_CODE",
          title: "Generate Next.js 14 Production Code & Diffs",
          description: "Synthesize React components, layout, styles, and unified reviewable diffs",
          status: "pending",
        },
        {
          id: "step_8",
          assignedAgent: "VISUAL_QA",
          title: "Multi-Agent Quality Assurance & Verification",
          description: "Run visual regression, UX flow traversal, axe-core A11y, and security audits",
          status: "pending",
        },
      ],
    };

    this.activeRuns.set(planId, {
      planId,
      projectId,
      plan,
      abortController,
      isPaused: false,
      artifacts,
    });

    const checkCancellation = (index: number) => {
      if (abortController.signal.aborted) {
        plan.steps[index].status = "failed";
        plan.steps[index].error = "Execution cancelled by user";
        this.emit("agent.failed", { projectId, step: plan.steps[index] });
        throw new Error("Execution cancelled by user");
      }
    };

    // Helper to advance a step
    const advanceStep = (index: number, state: WorkflowState) => {
      checkCancellation(index);
      plan.currentStepIndex = index;
      plan.steps[index].status = "running";
      this.emit("agent.started", {
        projectId,
        step: plan.steps[index],
        state,
      });
    };

    const completeStep = (index: number, outputArtifactId?: string) => {
      checkCancellation(index);
      plan.steps[index].status = "completed";
      plan.steps[index].outputArtifactId = outputArtifactId;
      this.emit("agent.completed", {
        projectId,
        step: plan.steps[index],
      });
    };

    // 1. Requirements Step
    advanceStep(0, "ANALYZING");
    const spec = await this.requirementsAgent.generateSpec(prompt);
    const specArtifact: ArtifactEnvelope<ProductSpecContent> = {
      id: `art_spec_${Date.now()}`,
      projectId,
      artifactType: "PRODUCT_SPEC",
      schemaVersion: "1.0",
      version: 1,
      branch: "main",
      status: "committed",
      createdBy: "agent_requirements",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: spec,
      metadata: { promptLength: prompt.length },
    };
    artifacts.push(specArtifact);
    this.emit("artifact.created", { artifact: specArtifact });
    completeStep(0, specArtifact.id);

    // 2. UX Research Step
    advanceStep(1, "REQUIREMENTS_READY");
    const research = await this.uxResearchAgent.generateResearch(spec);
    const personaArtifact: ArtifactEnvelope<PersonaContent[]> = {
      id: `art_personas_${Date.now()}`,
      projectId,
      artifactType: "PERSONA",
      schemaVersion: "1.0",
      version: 1,
      parentArtifactId: specArtifact.id,
      branch: "main",
      status: "committed",
      createdBy: "agent_ux_research",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: research.personas,
    };
    artifacts.push(personaArtifact);
    completeStep(1, personaArtifact.id);

    // 3. UX Designer Step
    advanceStep(2, "UX_DESIGNING");
    const ia = await this.uxDesignerAgent.generateIA(spec);
    const flow = await this.uxDesignerAgent.generateFlow(spec);
    const wireframes = await this.uxDesignerAgent.generateWireframes(spec);

    const iaArtifact: ArtifactEnvelope<InformationArchitectureContent> = {
      id: `art_ia_${Date.now()}`,
      projectId,
      artifactType: "INFORMATION_ARCHITECTURE",
      schemaVersion: "1.0",
      version: 1,
      parentArtifactId: specArtifact.id,
      branch: "main",
      status: "committed",
      createdBy: "agent_ux_designer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: ia,
    };
    const flowArtifact: ArtifactEnvelope<UserFlowContent> = {
      id: `art_flow_${Date.now()}`,
      projectId,
      artifactType: "USER_FLOW",
      schemaVersion: "1.0",
      version: 1,
      parentArtifactId: iaArtifact.id,
      branch: "main",
      status: "committed",
      createdBy: "agent_ux_designer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: flow,
    };
    const wireframeArtifact: ArtifactEnvelope<WireframeContent[]> = {
      id: `art_wf_${Date.now()}`,
      projectId,
      artifactType: "WIREFRAME",
      schemaVersion: "1.0",
      version: 1,
      parentArtifactId: flowArtifact.id,
      branch: "main",
      status: "committed",
      createdBy: "agent_ux_designer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: wireframes,
    };
    artifacts.push(iaArtifact, flowArtifact, wireframeArtifact);
    completeStep(2, flowArtifact.id);

    // 4. Design System Step
    advanceStep(3, "UX_READY");
    const designSystem = await this.designSystemAgent.generateDesignSystem(spec.title);
    const dsArtifact: ArtifactEnvelope<DesignSystemContent> = {
      id: `art_ds_${Date.now()}`,
      projectId,
      artifactType: "DESIGN_SYSTEM",
      schemaVersion: "1.0",
      version: 1,
      branch: "main",
      status: "committed",
      createdBy: "agent_design_system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: designSystem,
    };
    artifacts.push(dsArtifact);
    completeStep(3, dsArtifact.id);

    // 5. UI Designer Step (Hi-Fi Screen)
    advanceStep(4, "UI_DESIGNING");
    const screen = await this.uiDesignerAgent.generateScreen(spec, "screen_dashboard");
    const screenArtifact: ArtifactEnvelope<ScreenContent> = {
      id: `art_screen_${Date.now()}`,
      projectId,
      artifactType: "SCREEN",
      schemaVersion: "1.0",
      version: 1,
      parentArtifactId: wireframeArtifact.id,
      branch: "main",
      status: "committed",
      createdBy: "agent_ui_designer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: screen,
    };
    artifacts.push(screenArtifact);
    completeStep(4, screenArtifact.id);

    // 6. Prototype Step
    advanceStep(5, "UI_READY");
    const prototype = await this.prototypeAgent.generatePrototype([screen], flow);
    const protoArtifact: ArtifactEnvelope<PrototypeContent> = {
      id: `art_proto_${Date.now()}`,
      projectId,
      artifactType: "PROTOTYPE",
      schemaVersion: "1.0",
      version: 1,
      parentArtifactId: screenArtifact.id,
      branch: "main",
      status: "committed",
      createdBy: "agent_prototype",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: prototype,
    };
    artifacts.push(protoArtifact);
    completeStep(5, protoArtifact.id);

    // 7. Frontend Code Step
    advanceStep(6, "PROTOTYPE_READY");
    const { snapshot, diff } = await this.codeAgent.generateCodeSnapshot(screen, designSystem);
    const codeSnapshotArtifact: ArtifactEnvelope<CodeSnapshotContent> = {
      id: `art_code_${Date.now()}`,
      projectId,
      artifactType: "CODE_SNAPSHOT",
      schemaVersion: "1.0",
      version: 1,
      parentArtifactId: screenArtifact.id,
      branch: "main",
      status: "committed",
      createdBy: "agent_frontend_code",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: snapshot,
    };
    const codeDiffArtifact: ArtifactEnvelope<CodeDiffContent> = {
      id: `art_diff_${Date.now()}`,
      projectId,
      artifactType: "CODE_DIFF",
      schemaVersion: "1.0",
      version: 1,
      parentArtifactId: codeSnapshotArtifact.id,
      branch: "main",
      status: "committed",
      createdBy: "agent_frontend_code",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: diff,
    };
    artifacts.push(codeSnapshotArtifact, codeDiffArtifact);
    completeStep(6, codeSnapshotArtifact.id);

    // 8. QA Step
    advanceStep(7, "QA_RUNNING");
    const qaReport = await this.qaAgent.evaluate(screen, snapshot);
    const qaArtifact: ArtifactEnvelope<QAReportContent> = {
      id: `art_qa_${Date.now()}`,
      projectId,
      artifactType: "QA_REPORT",
      schemaVersion: "1.0",
      version: 1,
      parentArtifactId: codeSnapshotArtifact.id,
      branch: "main",
      status: "committed",
      createdBy: "agent_qa",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: qaReport,
    };
    artifacts.push(qaArtifact);
    completeStep(7, qaArtifact.id);

    const finalState: WorkflowState = "READY_FOR_APPROVAL";
    this.emit("approval.requested", {
      projectId,
      state: finalState,
      qaSummary: qaReport.summary,
    });

    return {
      state: finalState,
      plan,
      artifacts,
    };
  }
}
