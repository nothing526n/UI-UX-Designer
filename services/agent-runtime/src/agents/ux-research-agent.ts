import {
  PersonaContent,
  JourneyContent,
  ProductSpecContent,
} from "@platform/contracts";

export class UXResearchAgent {
  public async generateResearch(spec: ProductSpecContent): Promise<{
    personas: PersonaContent[];
    journeys: JourneyContent[];
  }> {
    const personas: PersonaContent[] = spec.actors.map((actor, idx) => ({
      id: `per_${actor.id}`,
      name: actor.name,
      role: actor.role,
      tagline: `Needs simplicity and rapid insights to accomplish daily goals.`,
      bio: actor.description,
      techComfort: idx === 0 ? "HIGH" : "MEDIUM",
      jtbd: [
        `When managing operations, I want to see urgent exceptions instantly so that I can prevent system delays.`,
        `When reviewing items, I want fast inline filters so that I don't waste time scrolling through irrelevant data.`,
      ],
      coreNeeds: actor.goals,
      frustrations: actor.painPoints,
      devicePreferences: ["MacBook Pro (16-inch)", "iPhone 15 Pro", "Dual Monitor Desktop"],
    }));

    const journeys: JourneyContent[] = [
      {
        id: "jrn_daily_triage",
        personaId: personas[0]?.id || "per_primary",
        title: "Daily Operational Health & Exception Triage",
        overview: "End-to-end journey from logging into the platform to resolving high-priority alerts.",
        steps: [
          {
            stage: "1. Awareness & Sign-in",
            action: "Logs into dashboard; observes top KPI banner and unread status alerts",
            userGoal: "Get an immediate pulse on system status in under 5 seconds",
            touchpoint: "Global Header & KPI Summary Cards",
            friction: "Too many blinking badges can cause alert fatigue",
            opportunity: "Group related alerts into severity tiers (Critical, Warning, Info)",
          },
          {
            stage: "2. Deep-Dive Inspection",
            action: "Clicks on high-urgency metric card to filter table to troubled items",
            userGoal: "Narrow focus to items requiring immediate human intervention",
            touchpoint: "Data Table with Active Filter Chip",
            opportunity: "Auto-apply filter preset directly upon clicking KPI card",
          },
          {
            stage: "3. Remediation & Action",
            action: "Opens record slide-over drawer; updates item status; triggers reassignment",
            userGoal: "Resolve the issue without leaving the current view",
            touchpoint: "Side-Over Detail Drawer & Action Buttons",
            opportunity: "Provide inline keyboard shortcut (Cmd+Enter) to save changes quickly",
          },
          {
            stage: "4. Verification",
            action: "Observes updated record in table with positive toast notification",
            userGoal: "Receive clear confirmation that the operation succeeded",
            touchpoint: "Toast Feedback & Table Row Status Badge",
          },
        ],
      },
    ];

    return { personas, journeys };
  }
}
