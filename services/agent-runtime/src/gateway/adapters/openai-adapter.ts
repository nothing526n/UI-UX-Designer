import {
  CanonicalModelRequest,
  CanonicalModelResponse,
  ModelProviderType,
} from "@platform/contracts";
import { IModelProviderAdapter } from "../adapter-interface.js";

export class OpenAIProviderAdapter implements IModelProviderAdapter {
  public providerType: ModelProviderType = "openai";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generate(
    req: CanonicalModelRequest,
    signal?: AbortSignal
  ): Promise<CanonicalModelResponse> {
    if (!this.isAvailable()) {
      throw new Error("OPENAI_API_KEY is not configured in environment");
    }

    const startTime = Date.now();
    const model = req.model || "gpt-4o-mini";
    const url = "https://api.openai.com/v1/chat/completions";

    const body: Record<string, any> = {
      model,
      temperature: req.temperature ?? 0.2,
      max_tokens: req.maxTokens || 4096,
      messages: req.messages,
    };

    if (req.responseFormat === "json_schema" && req.jsonSchema) {
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: "output_schema",
          schema: req.jsonSchema,
        },
      };
    } else if (req.responseFormat === "json_object") {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    let structuredOutput: Record<string, any> | undefined;

    if (req.responseFormat !== "text") {
      try {
        structuredOutput = JSON.parse(text);
      } catch {
        // Fallback
      }
    }

    const latencyMs = Date.now() - startTime;
    const promptTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const costEstimateUsd = (promptTokens * 0.00015 + outputTokens * 0.0006) / 1000;

    return {
      id: `call_openai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      provider: "openai",
      model,
      finishReason: data.choices?.[0]?.finish_reason === "stop" ? "stop" : "length",
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
