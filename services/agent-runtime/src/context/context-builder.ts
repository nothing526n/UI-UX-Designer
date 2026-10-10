import { AgentType, ArtifactEnvelope, ArtifactType } from "@platform/contracts";
import { agentRegistry } from "../registry/agent-registry.js";
import { promptRegistry } from "../registry/prompt-registry.js";

export interface AssembledContext {
  systemPrompt: string;
  userMessage: string;
  contextTokenEstimate: number;
  includedArtifactIds: string[];
}

export class ContextBuilder {
  /**
   * Assembles an authorized, token-budgeted prompt context for the target agent
   */
  public buildContext(params: {
    projectId: string;
    targetAgent: AgentType;
    prompt: string;
    availableArtifacts: ArtifactEnvelope[];
    maxTokenBudget?: number;
  }): AssembledContext {
    const budget = params.maxTokenBudget || 8000;
    const agentDef = agentRegistry.get(params.targetAgent);
    const requiredTypes: ArtifactType[] = agentDef?.inputArtifactTypes || [];

    const includedArtifactIds: string[] = [];
    const contextSections: string[] = [];

    // Filter and order relevant upstream artifacts
    for (const art of params.availableArtifacts) {
      if (requiredTypes.includes(art.artifactType)) {
        includedArtifactIds.push(art.id);
        const artStr = JSON.stringify(art.content, null, 2);

        // Budget check per section (approx 4 chars/token)
        if ((contextSections.join("\n").length + artStr.length) / 4 > budget * 0.7) {
          // Truncate long artifact content if budget is near
          contextSections.push(`### Upstream Artifact: ${art.artifactType} (Truncated for Budget)\n${artStr.slice(0, 2000)}...`);
        } else {
          contextSections.push(`### Upstream Artifact: ${art.artifactType}\n${artStr}`);
        }
      }
    }

    const systemPrompt = `You are the ${agentDef?.title || params.targetAgent}. ${agentDef?.description || ""}\nStrictly adhere to design-system contracts and structured output specifications.`;

    let userMessage = `PROJECT PROMPT:\n${params.prompt}`;
    if (contextSections.length > 0) {
      userMessage += `\n\nUPSTREAM PROJECT CONTEXT:\n${contextSections.join("\n\n")}`;
    }

    const totalText = systemPrompt + userMessage;
    const contextTokenEstimate = Math.ceil(totalText.length / 4);

    return {
      systemPrompt,
      userMessage,
      contextTokenEstimate,
      includedArtifactIds,
    };
  }
}

export const contextBuilder = new ContextBuilder();
