import {
  CanonicalModelRequest,
  CanonicalModelResponse,
  ModelProviderType,
} from "@platform/contracts";
import { IModelProviderAdapter } from "../adapter-interface.js";

export class AnthropicProviderAdapter implements IModelProviderAdapter {
  public providerType: ModelProviderType = "anthropic";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generate(
    req: CanonicalModelRequest,
    signal?: AbortSignal
  ): Promise<CanonicalModelResponse> {
    if (!this.isAvailable()) {
      throw new Error("ANTHROPIC_API_KEY is not configured in environment");
    }

    const startTime = Date.now();
    const model = req.model || "claude-3-5-sonnet-20240620";
    const url = "https://api.anthropic.com/v1/messages";

    const systemMessage = req.messages.find((m) => m.role === "system")?.content;
    const userMessages = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    const body: Record<string, any> = {
      model,
      max_tokens: req.maxTokens || 4096,
      temperature: req.temperature ?? 0.2,
      messages: userMessages,
    };

    if (systemMessage) {
      body.system = systemMessage;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    let structuredOutput: Record<string, any> | undefined;

    if (req.responseFormat !== "text") {
      try {
        structuredOutput = JSON.parse(text);
      } catch {
        // Fallback
      }
    }

    const latencyMs = Date.now() - startTime;
    const promptTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const costEstimateUsd = (promptTokens * 0.003 + outputTokens * 0.015) / 1000;

    return {
      id: `call_claude_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      provider: "anthropic",
      model,
      finishReason: "stop",
      text,
      structuredOutput,
      usage: {
        promptTokens,
        outputTokens,
        totalTokens: promptTokens + outputTokens,
        costEstimateUsd,
      },
      latencyMs,
    };
  }
}
