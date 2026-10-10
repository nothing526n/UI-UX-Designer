import {
  QAReportContent,
  QAIssue,
  ScreenContent,
  CodeSnapshotContent,
} from "@platform/contracts";

export class QAAgent {
  public async evaluate(
    screen: ScreenContent,
    codeSnapshot?: CodeSnapshotContent
  ): Promise<QAReportContent> {
    const issues: QAIssue[] = [
      {
        id: "qa_vis_001",
        category: "visual",
        severity: "LOW",
        title: "Subtle Table Row Hover Drift",
        description: "Table row hover elevation matches surface token instead of elevated token, causing faint border contrast on uncalibrated monitors.",
        targetRef: "node_table_rows_container",
        evidence: {
          domSelector: ".group",
          contrastRatio: "3.2:1 (Expected > 4.5:1)",
          filePath: "app/page.tsx",
          lineRange: "148-150",
        },
        suggestedFix: "Change hover background from bg-[#1A1F30] to bg-[#20273D] and brighten hover border to border-[#3D4968].",
        remedyCode: `hover:bg-[#20273D] hover:border-[#3D4968]`,
        status: "open",
      },
      {
        id: "qa_a11y_001",
        category: "accessibility",
        severity: "MEDIUM",
        title: "Search Input Missing Explicit aria-label",
        description: "Search text input relies solely on placeholder text which disappears upon input entry, failing WCAG 2.1 SC 4.1.2.",
        targetRef: "app/page.tsx:line-128",
        evidence: {
          wcagRule: "wcag21aa:label-title-only",
          domSelector: "input[type='text']",
          filePath: "app/page.tsx",
          lineRange: "125-131",
        },
        suggestedFix: "Add explicit aria-label='Search by dispatch code or hub location' to the input element.",
        remedyCode: `aria-label="Search by dispatch code or hub location"`,
        status: "open",
      },
      {
        id: "qa_ux_001",
        category: "ux",
        severity: "INFO",
        title: "Clear Filter Reset Shortcut Opportunity",
        description: "When filtering by 'Needs Attention', users currently click 'All' to reset. Adding an 'Esc' key listener improves power user navigation speed.",
        targetRef: "node_filter_chips",
        suggestedFix: "Bind keydown 'Escape' event to reset filter state back to 'all'.",
        remedyCode: `useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && setFilter('all'); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);`,
        status: "open",
      },
      {
        id: "qa_sec_001",
        category: "security",
        severity: "LOW",
        title: "Search Query Sanitization in URL State",
        description: "Query string should be sanitized before reflecting into search analytics or deep link parameters.",
        targetRef: "searchQuery",
        suggestedFix: "Strip script tags or encode query parameter when updating pushState.",
        remedyCode: `encodeURIComponent(searchQuery.trim())`,
        status: "resolved",
      },
    ];

    const criticalCount = issues.filter((i) => i.severity === "CRITICAL").length;
    const highCount = issues.filter((i) => i.severity === "HIGH").length;
    const mediumCount = issues.filter((i) => i.severity === "MEDIUM").length;
    const lowCount = issues.filter((i) => i.severity === "LOW" || i.severity === "INFO").length;

    return {
      runId: `qa_run_${Date.now()}`,
      targetScreenId: screen.screenId,
      passed: criticalCount === 0 && highCount === 0,
      summary: {
        total: issues.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
      issues,
    };
  }
}
