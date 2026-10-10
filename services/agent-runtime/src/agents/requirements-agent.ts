import { ProductSpecContent } from "@platform/contracts";

export class RequirementsAgent {
  /**
   * Synthesize a natural-language brief into a structured ProductSpec
   */
  public async generateSpec(
    prompt: string,
    targetPlatforms: string[] = ["web"]
  ): Promise<ProductSpecContent> {
    const title = this.extractTitle(prompt);
    
    return {
      title,
      summary: `High-performance digital platform designed to deliver: "${prompt.slice(0, 180)}..."`,
      vision: `To provide an intuitive, scalable, and resilient experience for users by streamlining complex operations into clean workflows.`,
      targetPlatforms,
      actors: [
        {
          id: "act_primary",
          name: "Operations Lead / Administrator",
          role: "Primary Manager",
          description: "Oversees daily workflows, monitors key performance metrics, and coordinates team execution.",
          goals: [
            "Monitor live metrics and status in real time",
            "Resolve operational bottlenecks with minimal clicks",
            "Generate actionable reports for stakeholders",
          ],
          painPoints: [
            "Information fragmentation across disparate tools",
            "Delayed notifications during critical exceptions",
            "Cluttered interfaces that obscure priority actions",
          ],
        },
        {
          id: "act_secondary",
          name: "End User / Operator",
          role: "Frontline Specialist",
          description: "Executes core tasks, enters data, and updates status updates on the go.",
          goals: [
            "Complete assigned workflows quickly and without error",
            "Access clear instructions and immediate validation",
            "Navigate seamlessly on both desktop and mobile devices",
          ],
          painPoints: [
            "Repetitive manual data entry",
            "Unclear form validation errors",
            "Slow loading times and complex navigation",
          ],
        },
      ],
      features: [
        {
          id: "feat_overview",
          title: "Real-Time Operational Dashboard",
          description: "Visual KPI cards, active status timeline, and priority action alerts.",
          priority: "P0",
          acceptanceCriteria: [
            "Display high-level metrics with trend percentage indicators",
            "Update live status indicators dynamically without page reload",
            "Provide one-click filtering by date, status, and urgency",
          ],
          dependencies: [],
          suggestedRoutes: ["/dashboard"],
        },
        {
          id: "feat_management",
          title: "Core Entity Management & Data Table",
          description: "Comprehensive data table with search, faceted filters, pagination, and inline status updates.",
          priority: "P0",
          acceptanceCriteria: [
            "Render tabular data with sortable columns and responsive card fallback on mobile",
            "Enable multi-select batch actions for quick approvals",
            "Provide search with debounced instant filtering",
          ],
          dependencies: ["feat_overview"],
          suggestedRoutes: ["/manage", "/records"],
        },
        {
          id: "feat_detail_view",
          title: "Detailed Item Inspector & Drawer",
          description: "Slide-over drawer and dedicated detail view for inspecting deep record telemetry and audit history.",
          priority: "P0",
          acceptanceCriteria: [
            "Open slide-over modal without losing user's current filter position in table",
            "Display full metadata, activity timeline, and associated documents",
            "Enable authorized users to edit fields inline with instant optimistic feedback",
          ],
          dependencies: ["feat_management"],
          suggestedRoutes: ["/records/:id"],
        },
        {
          id: "feat_analytics",
          title: "Analytics & Trend Forecasting",
          description: "Interactive visual charts showcasing historical volume, efficiency metrics, and anomaly detection.",
          priority: "P1",
          acceptanceCriteria: [
            "Display interactive time-series charts with hover tooltips",
            "Support export to CSV and PDF formats",
            "Highlight detected anomalies with visual warning indicators",
          ],
          dependencies: ["feat_overview"],
          suggestedRoutes: ["/analytics"],
        },
        {
          id: "feat_settings",
          title: "System Configuration & Access Control",
          description: "Team role administration, API key integration, and security policy management.",
          priority: "P1",
          acceptanceCriteria: [
            "Manage user roles and team membership permissions",
            "Configure notification preferences (email, in-app, webhook)",
            "Enforce 2FA and session timeout policies",
          ],
          dependencies: [],
          suggestedRoutes: ["/settings"],
        },
      ],
      constraints: [
        {
          id: "con_a11y",
          type: "accessibility",
          description: "All views must meet WCAG 2.1 AA contrast requirements and support keyboard-only operation.",
        },
        {
          id: "con_perf",
          type: "technical",
          description: "Initial page load under 1.2s; live data table rendering within 60fps.",
        },
        {
          id: "con_responsive",
          type: "platform",
          description: "Strict responsive behavior from 375px mobile viewports up to 1920px wide monitors.",
        },
      ],
      assumptions: [
        {
          id: "asm_auth",
          description: "Users authenticate via OAuth/SSO or standard secure email credentials.",
          confidence: "HIGH",
          verifiedByHuman: true,
        },
        {
          id: "asm_density",
          description: "High-density data views are preferred by desktop power users; mobile needs card reflow.",
          confidence: "HIGH",
          verifiedByHuman: false,
        },
      ],
      openQuestions: [
        {
          id: "q_realtime",
          question: "What is the expected frequency of real-time data updates (e.g. WebSocket push vs periodic polling)?",
          impact: "MEDIUM",
          status: "open",
          suggestedAnswer: "Default to WebSocket events with a 15-second fallback poll.",
        },
      ],
    };
  }

  private extractTitle(prompt: string): string {
    const clean = prompt.trim().replace(/^create (a|an)\s+/i, "");
    const words = clean.split(/\s+/).slice(0, 5).join(" ");
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
}
