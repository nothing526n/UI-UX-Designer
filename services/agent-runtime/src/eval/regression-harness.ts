/**
 * Automated Regression Test Harness
 * Implements Phase 2 AI Platform Core benchmark and quality verification.
 * Runs golden datasets across specialist agents and validates schema adherence,
 * state machine progression, latency metrics, and artifact completeness.
 */

import {
  ArtifactEnvelopeSchema,
  WorkflowState,
  TaskPlan,
  ArtifactEnvelope,
} from "@platform/contracts";
import { AIOrchestrator } from "../orchestrator.js";
import { GOLDEN_DATASET, GoldenTestCase } from "./golden-dataset.js";

export interface RegressionCaseResult {
  id: string;
  domain: string;
  passed: boolean;
  durationMs: number;
  artifactCount: number;
  finalState: WorkflowState | "FAILED";
  screenNodeCount: number;
  codeFilesGenerated: number;
  qaScore?: number;
  schemaViolations: string[];
  errors: string[];
}

export interface RegressionReport {
  timestamp: string;
  passed: boolean;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRatePercent: number;
  totalDurationMs: number;
  averageDurationMs: number;
  p95DurationMs: number;
  caseResults: RegressionCaseResult[];
}

export interface RegressionOptions {
  dataset?: GoldenTestCase[];
  minPassRatePercent?: number;
  maxDurationPerCaseMs?: number;
  customOrchestrator?: AIOrchestrator;
}

export class RegressionHarness {
  private orchestrator: AIOrchestrator;

  constructor(orchestrator?: AIOrchestrator) {
    this.orchestrator = orchestrator || new AIOrchestrator();
  }

  /**
   * Execute complete regression suite across golden test cases
   */
  public async runSuite(options: RegressionOptions = {}): Promise<RegressionReport> {
    const dataset = options.dataset || GOLDEN_DATASET;
    const minPassRate = options.minPassRatePercent ?? 95;
    const maxDuration = options.maxDurationPerCaseMs ?? 30000;

    const caseResults: RegressionCaseResult[] = [];
    const durations: number[] = [];
    let passedCount = 0;
    const suiteStartTime = Date.now();

    for (const testCase of dataset) {
      const caseStartTime = Date.now();
      const schemaViolations: string[] = [];
      const errors: string[] = [];
      let finalArtifacts: ArtifactEnvelope[] = [];
      let finalState: WorkflowState | "FAILED" = "INIT";
      let screenNodeCount = 0;
      let codeFilesGenerated = 0;
      let qaScore: number | undefined;

      try {
        const result = await this.orchestrator.executeGoldenLoop(
          `regression_${testCase.id}`,
          testCase.prompt
        );

        finalState = result.state;
        finalArtifacts = result.artifacts;

        // 1. Validate all artifact envelopes against strict Zod schema
        for (const art of finalArtifacts) {
          const parseResult = ArtifactEnvelopeSchema.safeParse(art);
          if (!parseResult.success) {
            schemaViolations.push(
              `Artifact ${art.id} (${art.artifactType}): ${parseResult.error.message}`
            );
          }

          // Count screen nodes recursively
          if (art.artifactType === "SCREEN") {
            const screen = art.content as any;
            const countNodes = (node: any): number => {
              if (!node) return 0;
              let total = 1;
              if (Array.isArray(node.children)) {
                for (const child of node.children) {
                  total += countNodes(child);
                }
              }
              return total;
            };
            if (screen && screen.rootNode) {
              screenNodeCount = countNodes(screen.rootNode);
            } else if (screen && Array.isArray(screen.nodes)) {
              screenNodeCount = screen.nodes.length;
            }
          }

          // Count code files
          if (art.artifactType === "CODE_SNAPSHOT") {
            const code = art.content as any;
            if (code && Array.isArray(code.files)) {
              codeFilesGenerated = code.files.length;
            }
          }

          // Extract QA score
          if (art.artifactType === "QA_REPORT") {
            const qa = art.content as any;
            if (qa && typeof qa.overallScore === "number") {
              qaScore = qa.overallScore;
            }
          }
        }

        // 2. Assert minimum artifact requirements
        if (finalArtifacts.length < testCase.expectedMinArtifacts) {
          errors.push(
            `Artifact count (${finalArtifacts.length}) below expected (${testCase.expectedMinArtifacts})`
          );
        }

        // 3. Assert minimum screen nodes
        if (screenNodeCount < testCase.expectedMinScreenNodes) {
          errors.push(
            `Screen nodes count (${screenNodeCount}) below expected (${testCase.expectedMinScreenNodes})`
          );
        }

        // 4. Assert state reached approval readiness
        if (finalState !== "READY_FOR_APPROVAL") {
          errors.push(`Final workflow state '${finalState}' was not READY_FOR_APPROVAL`);
        }

        // 5. Assert timeout constraint
        const durationMs = Date.now() - caseStartTime;
        durations.push(durationMs);
        if (durationMs > maxDuration) {
          errors.push(`Execution duration ${durationMs}ms exceeded threshold ${maxDuration}ms`);
        }

        const casePassed = errors.length === 0 && schemaViolations.length === 0;
        if (casePassed) passedCount++;

        caseResults.push({
          id: testCase.id,
          domain: testCase.domain,
          passed: casePassed,
          durationMs,
          artifactCount: finalArtifacts.length,
          finalState,
          screenNodeCount,
          codeFilesGenerated,
          qaScore,
          schemaViolations,
          errors,
        });
      } catch (err: any) {
        const durationMs = Date.now() - caseStartTime;
        durations.push(durationMs);
        caseResults.push({
          id: testCase.id,
          domain: testCase.domain,
          passed: false,
          durationMs,
          artifactCount: 0,
          finalState: "FAILED",
          screenNodeCount: 0,
          codeFilesGenerated: 0,
          schemaViolations,
          errors: [err.message],
        });
      }
    }

    const totalDurationMs = Date.now() - suiteStartTime;
    const averageDurationMs = durations.length > 0 ? Math.round(totalDurationMs / durations.length) : 0;
    
    // Compute P95 duration
    durations.sort((a, b) => a - b);
    const p95Idx = Math.min(Math.floor(durations.length * 0.95), durations.length - 1);
    const p95DurationMs = durations[p95Idx] || 0;

    const passRatePercent = dataset.length > 0 ? Math.round((passedCount / dataset.length) * 100) : 0;
    const passed = passRatePercent >= minPassRate;

    return {
      timestamp: new Date().toISOString(),
      passed,
      totalCases: dataset.length,
      passedCases: passedCount,
      failedCases: dataset.length - passedCount,
      passRatePercent,
      totalDurationMs,
      averageDurationMs,
      p95DurationMs,
      caseResults,
    };
  }

  /**
   * Format regression report into GitHub-flavored Markdown
   */
  public static generateMarkdownReport(report: RegressionReport): string {
    const statusIcon = report.passed ? "✅ PASS" : "❌ FAIL";
    let md = `# AI Platform Core Regression Report: ${statusIcon}\n\n`;
    md += `* **Timestamp:** ${report.timestamp}\n`;
    md += `* **Pass Rate:** ${report.passRatePercent}% (${report.passedCases}/${report.totalCases})\n`;
    md += `* **Total Duration:** ${report.totalDurationMs}ms (Avg: ${report.averageDurationMs}ms, p95: ${report.p95DurationMs}ms)\n\n`;
    md += `| Test Case | Domain | Status | Artifacts | Nodes | Code Files | QA Score | Duration |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const res of report.caseResults) {
      const resIcon = res.passed ? "✅ PASS" : "❌ FAIL";
      md += `| \`${res.id}\` | ${res.domain} | ${resIcon} | ${res.artifactCount} | ${res.screenNodeCount} | ${res.codeFilesGenerated} | ${res.qaScore ?? "N/A"}% | ${res.durationMs}ms |\n`;
    }

    return md;
  }
}
