import {
  CanonicalModelRequest,
  CanonicalModelResponse,
  ModelProviderType,
} from "@platform/contracts";
import { IModelProviderAdapter } from "../adapter-interface.js";

export class MockProviderAdapter implements IModelProviderAdapter {
  public providerType: ModelProviderType = "mock";

  public isAvailable(): boolean {
    return true; // Always available
  }

  public async generate(
    req: CanonicalModelRequest,
    signal?: AbortSignal
  ): Promise<CanonicalModelResponse> {
    const startTime = Date.now();

    // Check cancellation before work
    if (signal?.aborted) {
      throw new Error("Model request cancelled by user (AbortSignal)");
    }

    // Short simulated latency (15ms)
    await new Promise((resolve) => setTimeout(resolve, 15));

    if (signal?.aborted) {
      throw new Error("Model request cancelled by user (AbortSignal)");
    }

    const lastMessage = req.messages[req.messages.length - 1]?.content || "";
    let output: Record<string, any> = {};

    // Generate context-aware mock output if requested format is JSON
    if (req.responseFormat === "json_schema" || req.responseFormat === "json_object") {
      if (lastMessage.includes("spec") || lastMessage.includes("requirements")) {
        output = {
          title: "Synthesized Product Specification",
          summary: `AI-synthesized spec for: "${lastMessage.slice(0, 100)}..."`,
          vision: "Scalable high-performance digital solution",
          targetPlatforms: ["web"],
          features: [
            { id: "feat_1", title: "Core Operations Dashboard", priority: "P0", acceptanceCriteria: ["Realtime KPI display"] },
            { id: "feat_2", title: "Exception Triage Stream", priority: "P0", acceptanceCriteria: ["Filterable exception cards"] },
          ],
        };
      } else if (lastMessage.includes("persona") || lastMessage.includes("journey")) {
        output = {
          personas: [
            { id: "p1", name: "Operations Lead", role: "Primary Manager", goals: ["High uptime"], painPoints: ["Fragmented tooling"] },
          ],
        };
      } else {
        output = {
          status: "success",
          generatedBy: "MockProviderAdapter",
          promptSummary: lastMessage.slice(0, 80),
          timestamp: new Date().toISOString(),
        };
      }
    }

    const latencyMs = Date.now() - startTime;
    const promptTokens = Math.ceil(lastMessage.length / 4);
    const outputTokens = Math.ceil(JSON.stringify(output).length / 4);

    return {
      id: `call_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      provider: "mock",
      model: req.model || "mock-model-v1",
      finishReason: "stop",
      text: JSON.stringify(output, null, 2),
      structuredOutput: output,
      usage: {
        promptTokens,
        outputTokens,
        totalTokens: promptTokens + outputTokens,
        costEstimateUsd: 0.0,
      },
      latencyMs,
    };
  }
}
