import {
  CanonicalModelRequest,
  CanonicalModelResponse,
  ModelProviderType,
} from "@platform/contracts";
import { IModelProviderAdapter } from "../adapter-interface.js";

export class GeminiProviderAdapter implements IModelProviderAdapter {
  public providerType: ModelProviderType = "gemini";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generate(
    req: CanonicalModelRequest,
    signal?: AbortSignal
  ): Promise<CanonicalModelResponse> {
    if (!this.isAvailable()) {
      throw new Error("GEMINI_API_KEY is not configured in environment");
    }

    const startTime = Date.now();
    const model = req.model || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    // Convert canonical messages to Gemini contents format
    const contents = req.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const generationConfig: Record<string, any> = {
      temperature: req.temperature ?? 0.2,
      maxOutputTokens: req.maxTokens ?? 4096,
    };

    if (req.responseFormat === "json_schema" || req.responseFormat === "json_object") {
      generationConfig.responseMimeType = "application/json";
      if (req.jsonSchema) {
        generationConfig.responseSchema = req.jsonSchema;
      }
    }

    const payload = {
      contents,
      generationConfig,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let structuredOutput: Record<string, any> | undefined;

    if (req.responseFormat !== "text") {
      try {
        structuredOutput = JSON.parse(text);
      } catch {
        // Fallback if parsing fails
      }
    }

    const latencyMs = Date.now() - startTime;
    const promptTokens = data.usageMetadata?.promptTokenCount || Math.ceil(JSON.stringify(contents).length / 4);
    const outputTokens = data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);

    // Approximate cost: Gemini 1.5 Flash $0.000075 / 1k input, $0.0003 / 1k output
    const costEstimateUsd = (promptTokens * 0.000075 + outputTokens * 0.0003) / 1000;

    return {
      id: `call_gemini_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      provider: "gemini",
      model,
      finishReason: data.candidates?.[0]?.finishReason === "STOP" ? "stop" : "length",
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
