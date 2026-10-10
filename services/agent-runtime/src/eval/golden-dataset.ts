import { AIOrchestrator } from "../orchestrator.js";

export interface GoldenTestCase {
  id: string;
  domain: string;
  prompt: string;
  expectedMinArtifacts: number;
  expectedMinScreenNodes: number;
}

export const GOLDEN_DATASET: GoldenTestCase[] = [
  {
    id: "case_logistics",
    domain: "Logistics & Fleet OS",
    prompt: "SaaS Freight & Logistics Command Center with live telemetry, dispatch pipeline, and exception triage",
    expectedMinArtifacts: 8,
    expectedMinScreenNodes: 6,
  },
  {
    id: "case_fintech",
    domain: "FinTech Portfolio",
    prompt: "Enterprise Institutional Portfolio Management & Real-time Risk Hedging Analytics Dashboard",
    expectedMinArtifacts: 8,
    expectedMinScreenNodes: 6,
  },
  {
    id: "case_ecommerce",
    domain: "E-Commerce",
    prompt: "Minimalist High-Fashion Luxury Storefront with dynamic cart drawer and instant checkout",
    expectedMinArtifacts: 8,
    expectedMinScreenNodes: 6,
  },
  {
    id: "case_healthtech",
    domain: "Healthcare",
    prompt: "Telehealth Remote Patient Monitoring Portal with biometric vitals trends and clinician chart notes",
    expectedMinArtifacts: 8,
    expectedMinScreenNodes: 6,
  },
];

export interface EvalReport {
  passed: boolean;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRatePercent: number;
  caseResults: Array<{
    id: string;
    domain: string;
    passed: boolean;
    artifactCount: number;
    durationMs: number;
    error?: string;
  }>;
}

export class EvaluationRunner {
  private orchestrator = new AIOrchestrator();

  public async runSuite(): Promise<EvalReport> {
    const caseResults: EvalReport["caseResults"] = [];
    let passedCount = 0;

    for (const testCase of GOLDEN_DATASET) {
      const startTime = Date.now();
      try {
        const result = await this.orchestrator.executeGoldenLoop(
          `eval_${testCase.id}`,
          testCase.prompt
        );

        const durationMs = Date.now() - startTime;
        const validArtifactCount = result.artifacts.length >= testCase.expectedMinArtifacts;

        if (validArtifactCount && result.state === "READY_FOR_APPROVAL") {
          passedCount++;
          caseResults.push({
            id: testCase.id,
            domain: testCase.domain,
            passed: true,
            artifactCount: result.artifacts.length,
            durationMs,
          });
        } else {
          caseResults.push({
            id: testCase.id,
            domain: testCase.domain,
            passed: false,
            artifactCount: result.artifacts.length,
            durationMs,
            error: `Artifact count (${result.artifacts.length}) below minimum expected (${testCase.expectedMinArtifacts})`,
          });
        }
      } catch (err: any) {
        caseResults.push({
          id: testCase.id,
          domain: testCase.domain,
          passed: false,
          artifactCount: 0,
          durationMs: Date.now() - startTime,
          error: err.message,
        });
      }
    }

    const passRatePercent = Math.round((passedCount / GOLDEN_DATASET.length) * 100);

    return {
      passed: passRatePercent >= 95,
      totalCases: GOLDEN_DATASET.length,
      passedCases: passedCount,
      failedCases: GOLDEN_DATASET.length - passedCount,
      passRatePercent,
      caseResults,
    };
  }
}
