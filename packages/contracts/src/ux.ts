import { z } from "zod";

export const PersonaContentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  tagline: z.string(),
  bio: z.string(),
  techComfort: z.enum(["LOW", "MEDIUM", "HIGH", "POWER_USER"]),
  jtbd: z.array(z.string()), // Jobs to be done
  coreNeeds: z.array(z.string()),
  frustrations: z.array(z.string()),
  devicePreferences: z.array(z.string()),
});
export type PersonaContent = z.infer<typeof PersonaContentSchema>;

export const JourneyStepSchema = z.object({
  stage: z.string(),
  action: z.string(),
  userGoal: z.string(),
  touchpoint: z.string(),
  friction: z.string().optional(),
  opportunity: z.string().optional(),
});
export type JourneyStep = z.infer<typeof JourneyStepSchema>;

export const JourneyContentSchema = z.object({
  id: z.string(),
  personaId: z.string(),
  title: z.string(),
  overview: z.string(),
  steps: z.array(JourneyStepSchema),
});
export type JourneyContent = z.infer<typeof JourneyContentSchema>;

export type RouteNode = {
  id: string;
  title: string;
  route: string;
  purpose: string;
  isAuthRequired: boolean;
  rolesAllowed: string[];
  children: RouteNode[];
};

export const RouteNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    route: z.string(),
    purpose: z.string(),
    isAuthRequired: z.boolean().default(true),
    rolesAllowed: z.array(z.string()).default(["*"]),
    children: z.array(RouteNodeSchema).default([]),
  })
);

export const InformationArchitectureContentSchema = z.object({
  title: z.string(),
  rootRoutes: z.array(RouteNodeSchema),
  navigationSystems: z.object({
    sidebar: z.array(z.string()).default([]),
    topbar: z.array(z.string()).default([]),
    footer: z.array(z.string()).default([]),
  }),
});
export type InformationArchitectureContent = z.infer<
  typeof InformationArchitectureContentSchema
>;

export const FlowNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["start", "screen", "decision", "action", "end"]),
  routeRef: z.string().optional(),
  description: z.string().optional(),
  coordinates: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type FlowNode = z.infer<typeof FlowNodeSchema>;

export const FlowEdgeSchema = z.object({
  id: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  label: z.string().optional(),
  condition: z.string().optional(),
});
export type FlowEdge = z.infer<typeof FlowEdgeSchema>;

export const UserFlowContentSchema = z.object({
  id: z.string(),
  featureRef: z.string(),
  title: z.string(),
  nodes: z.array(FlowNodeSchema),
  edges: z.array(FlowEdgeSchema),
});
export type UserFlowContent = z.infer<typeof UserFlowContentSchema>;

export type WireframeBlock = {
  id: string;
  type:
    | "navbar"
    | "sidebar"
    | "page_header"
    | "hero"
    | "metrics_row"
    | "card_grid"
    | "data_table"
    | "form"
    | "chart"
    | "modal_dialog"
    | "footer";
  title?: string;
  description?: string;
  children: WireframeBlock[];
  estimatedProps?: Record<string, any>;
};

export const WireframeBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.enum([
      "navbar",
      "sidebar",
      "page_header",
      "hero",
      "metrics_row",
      "card_grid",
      "data_table",
      "form",
      "chart",
      "modal_dialog",
      "footer",
    ]),
    title: z.string().optional(),
    description: z.string().optional(),
    children: z.array(WireframeBlockSchema).default([]),
    estimatedProps: z.record(z.any()).optional(),
  })
);

export const StateMatrixSchema = z.object({
  defaultState: z.string(),
  loadingState: z.string().optional(),
  emptyState: z.string().optional(),
  errorState: z.string().optional(),
  successState: z.string().optional(),
  disabledState: z.string().optional(),
});
export type StateMatrix = z.infer<typeof StateMatrixSchema>;

export const WireframeContentSchema = z.object({
  screenId: z.string(),
  title: z.string(),
  route: z.string(),
  targetViewport: z.enum(["desktop", "tablet", "mobile"]).default("desktop"),
  blocks: z.array(WireframeBlockSchema),
  states: StateMatrixSchema.optional(),
});
export type WireframeContent = z.infer<typeof WireframeContentSchema>;
