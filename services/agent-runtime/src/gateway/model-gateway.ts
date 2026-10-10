import {
  CanonicalModelRequest,
  CanonicalModelResponse,
  ModelProviderType,
} from "@platform/contracts";
import { IModelProviderAdapter } from "./adapter-interface.js";
import { MockProviderAdapter } from "./adapters/mock-adapter.js";
import { GeminiProviderAdapter } from "./adapters/gemini-adapter.js";
import { AnthropicProviderAdapter } from "./adapters/anthropic-adapter.js";
import { OpenAIProviderAdapter } from "./adapters/openai-adapter.js";

export interface GatewayTelemetry {
  totalCalls: number;
  totalPromptTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  providerCallCounts: Record<ModelProviderType, number>;
}

export class ModelGateway {
  private adapters = new Map<ModelProviderType, IModelProviderAdapter>();
  private telemetry: GatewayTelemetry = {
    totalCalls: 0,
    totalPromptTokens: 0,
    totalOutputTokens: 0,
    totalCostUsd: 0,
    providerCallCounts: { gemini: 0, anthropic: 0, openai: 0, mock: 0 },
  };

  constructor() {
    this.registerAdapter(new MockProviderAdapter());
    this.registerAdapter(new GeminiProviderAdapter());
    this.registerAdapter(new AnthropicProviderAdapter());
    this.registerAdapter(new OpenAIProviderAdapter());
  }

  public registerAdapter(adapter: IModelProviderAdapter): void {
    this.adapters.set(adapter.providerType, adapter);
  }

  public getAdapter(type: ModelProviderType): IModelProviderAdapter | undefined {
    return this.adapters.get(type);
  }

  /**
   * Determine optimal provider candidate list based on requested tier and availability
   */
  public resolveProviderChain(req: CanonicalModelRequest): ModelProviderType[] {
    const chain: ModelProviderType[] = [];

    // 1. Explicit provider request
    if (req.provider && this.adapters.get(req.provider)?.isAvailable()) {
      chain.push(req.provider);
    }

    // 2. Add available live providers according to tier policy
    if (req.tier === "REASONING") {
      if (this.adapters.get("gemini")?.isAvailable() && !chain.includes("gemini")) chain.push("gemini");
      if (this.adapters.get("anthropic")?.isAvailable() && !chain.includes("anthropic")) chain.push("anthropic");
      if (this.adapters.get("openai")?.isAvailable() && !chain.includes("openai")) chain.push("openai");
    } else {
      if (this.adapters.get("gemini")?.isAvailable() && !chain.includes("gemini")) chain.push("gemini");
      if (this.adapters.get("openai")?.isAvailable() && !chain.includes("openai")) chain.push("openai");
    }

    // 3. Guaranteed reliable fallback: Mock adapter
    if (!chain.includes("mock")) {
      chain.push("mock");
    }

    return chain;
  }

  /**
   * Execute model inference with automatic fallback circuit breaker
   */
  public async execute(
    req: CanonicalModelRequest,
    signal?: AbortSignal
  ): Promise<CanonicalModelResponse> {
    const providerChain = this.resolveProviderChain(req);
    let lastError: Error | null = null;

    for (const providerType of providerChain) {
      const adapter = this.adapters.get(providerType);
      if (!adapter || !adapter.isAvailable()) continue;

      try {
        if (signal?.aborted) {
          throw new Error("Execution cancelled by user (AbortSignal)");
        }

        const res = await adapter.generate(req, signal);

        // Record successful telemetry
        this.recordTelemetry(res);
        return res;
      } catch (err: any) {
        lastError = err;
        console.warn(`[ModelGateway] Provider '${providerType}' failed: ${err.message}. Attempting fallback...`);

        if (signal?.aborted) {
          throw err;
        }
      }
    }

    throw lastError || new Error("All model providers in resolution chain failed");
  }

  private recordTelemetry(res: CanonicalModelResponse): void {
    this.telemetry.totalCalls++;
    this.telemetry.totalPromptTokens += res.usage.promptTokens;
    this.telemetry.totalOutputTokens += res.usage.outputTokens;
    this.telemetry.totalCostUsd += res.usage.costEstimateUsd;
    this.telemetry.providerCallCounts[res.provider] =
      (this.telemetry.providerCallCounts[res.provider] || 0) + 1;
  }

  public getTelemetry(): GatewayTelemetry {
    return { ...this.telemetry };
  }
}

export const modelGateway = new ModelGateway();
