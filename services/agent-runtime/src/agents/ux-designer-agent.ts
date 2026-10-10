import {
  InformationArchitectureContent,
  UserFlowContent,
  WireframeContent,
  ProductSpecContent,
} from "@platform/contracts";

export class UXDesignerAgent {
  public async generateIA(spec: ProductSpecContent): Promise<InformationArchitectureContent> {
    return {
      title: `${spec.title} - Information Architecture`,
      rootRoutes: [
        {
          id: "route_dashboard",
          title: "Dashboard Overview",
          route: "/dashboard",
          purpose: "High-level KPI health metrics, recent activities, and urgent alerts.",
          isAuthRequired: true,
          rolesAllowed: ["*"],
          children: [],
        },
        {
          id: "route_management",
          title: "Entity Management",
          route: "/manage",
          purpose: "Faceted search, sortable data table, batch actions, and drawer preview.",
          isAuthRequired: true,
          rolesAllowed: ["*"],
          children: [
            {
              id: "route_detail",
              title: "Record Detail",
              route: "/manage/:id",
              purpose: "Deep inspection, telemetry timelines, and editing controls.",
              isAuthRequired: true,
              rolesAllowed: ["*"],
              children: [],
            },
          ],
        },
        {
          id: "route_analytics",
          title: "Analytics & Trends",
          route: "/analytics",
          purpose: "Time-series volume, efficiency ratios, and predictive charts.",
          isAuthRequired: true,
          rolesAllowed: ["*"],
          children: [],
        },
        {
          id: "route_settings",
          title: "Settings & Administration",
          route: "/settings",
          purpose: "Team permissions, API access keys, and workspace preferences.",
          isAuthRequired: true,
          rolesAllowed: ["ADMIN", "OWNER"],
          children: [],
        },
      ],
      navigationSystems: {
        sidebar: ["/dashboard", "/manage", "/analytics", "/settings"],
        topbar: ["Search (Cmd+K)", "Notifications", "User Profile"],
        footer: ["System Status: Operational", "v1.0.0"],
      },
    };
  }

  public async generateFlow(spec: ProductSpecContent): Promise<UserFlowContent> {
    return {
      id: "flow_primary_dispatch",
      featureRef: spec.features[0]?.id || "feat_overview",
      title: "Core Operational Flow",
      nodes: [
        {
          id: "node_start",
          label: "Dashboard Loaded",
          type: "start",
          routeRef: "/dashboard",
          coordinates: { x: 50, y: 100 },
        },
        {
          id: "node_filter",
          label: "Select Urgent Filter Chip",
          type: "action",
          routeRef: "/manage?filter=urgent",
          coordinates: { x: 260, y: 100 },
        },
        {
          id: "node_select_row",
          label: "Click Row to Open Drawer",
          type: "decision",
          routeRef: "/manage",
          coordinates: { x: 480, y: 100 },
        },
        {
          id: "node_edit",
          label: "Update Status & Save",
          type: "action",
          coordinates: { x: 700, y: 100 },
        },
        {
          id: "node_end",
          label: "Success Toast & Live Update",
          type: "end",
          coordinates: { x: 920, y: 100 },
        },
      ],
      edges: [
        { id: "e1", sourceNodeId: "node_start", targetNodeId: "node_filter", label: "Clicks 'Needs Attention'" },
        { id: "e2", sourceNodeId: "node_filter", targetNodeId: "node_select_row", label: "Table updates" },
        { id: "e3", sourceNodeId: "node_select_row", targetNodeId: "node_edit", label: "Drawer slides in" },
        { id: "e4", sourceNodeId: "node_edit", targetNodeId: "node_end", label: "Submits changes" },
      ],
    };
  }

  public async generateWireframes(spec: ProductSpecContent): Promise<WireframeContent[]> {
    return [
      {
        screenId: "wf_screen_dashboard",
        title: "Dashboard Wireframe",
        route: "/dashboard",
        targetViewport: "desktop",
        blocks: [
          {
            id: "wf_block_nav",
            type: "navbar",
            title: "Global Header Bar",
            children: [],
          },
          {
            id: "wf_block_hero",
            type: "page_header",
            title: "Welcome & High-Level KPI Summary",
            children: [],
          },
          {
            id: "wf_block_metrics",
            type: "metrics_row",
            title: "4x Metric Cards (Total Volume, Active Exceptions, Throughput, Efficiency)",
            children: [],
          },
          {
            id: "wf_block_table",
            type: "data_table",
            title: "Recent Active Records Table",
            children: [],
          },
        ],
        states: {
          defaultState: "Populated with 4 KPI cards and 10 recent records.",
          loadingState: "Skeleton pulse loaders for cards and shimmer rows for table.",
          emptyState: "Centered graphic with 'No records found' and 'Create Record' CTA button.",
          errorState: "Error banner with 'Unable to stream live metrics. Retry connection'.",
          successState: "Green check icon with 'Status synchronized'.",
        },
      },
    ];
  }
}
