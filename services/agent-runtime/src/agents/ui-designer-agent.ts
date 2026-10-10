import { ScreenContent, LayoutNode, ProductSpecContent, normalizeToAutoLayout } from "@platform/contracts";


export class UIDesignerAgent {
  public async generateScreen(
    spec: ProductSpecContent,
    screenId: string = "screen_dashboard"
  ): Promise<ScreenContent> {
    const rootNode: LayoutNode = {
      id: "node_root",
      name: "Root Viewport",
      type: "frame",
      props: {},
      styles: {
        width: "100%",
        minWidth: 320,
        backgroundColor: "#090A0F",
        backgroundToken: "bg.canvas",
        color: "#F3F6FC",
        colorToken: "text.primary",
        fontFamily: "'Inter', sans-serif",
      },
      children: [
        // Top Navigation Bar
        {
          id: "node_topbar",
          name: "Global Top Bar",
          type: "flex_row",
          props: {},
          styles: {
            width: "100%",
            height: 60,
            paddingLeft: 24,
            paddingRight: 24,
            backgroundColor: "#121520",
            backgroundToken: "bg.surface",
            borderColor: "#1E2538",
            borderToken: "border.subtle",
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "space-between",
          },
          children: [
            {
              id: "node_brand_group",
              name: "Brand & Title",
              type: "flex_row",
              props: {},
              styles: { alignItems: "center", gap: 12 },
              children: [
                {
                  id: "node_logo_badge",
                  name: "Logo Icon",
                  type: "badge",
                  textContent: "⚡",
                  props: {},
                  styles: {
                    backgroundColor: "#6366F1",
                    backgroundToken: "accent.primary",
                    borderRadius: 8,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 4,
                    paddingBottom: 4,
                    fontSize: 14,
                  },
                  children: [],
                },
                {
                  id: "node_brand_title",
                  name: "Platform Name",
                  type: "text",
                  textContent: spec.title,
                  props: {},
                  styles: { fontSize: 16, fontWeight: 600, color: "#F3F6FC" },
                  children: [],
                },
              ],
            },
            {
              id: "node_topbar_actions",
              name: "Right Actions",
              type: "flex_row",
              props: {},
              styles: { alignItems: "center", gap: 16 },
              children: [
                {
                  id: "node_status_pill",
                  name: "System Status Pill",
                  type: "badge",
                  textContent: "● All Systems Normal",
                  props: {},
                  styles: {
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#10B981",
                    borderRadius: 9999,
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 4,
                    paddingBottom: 4,
                    fontSize: 12,
                    fontWeight: 500,
                  },
                  children: [],
                },
                {
                  id: "node_btn_create",
                  name: "New Entry Button",
                  type: "button",
                  textContent: "+ New Record",
                  componentRef: "comp_button",
                  props: { variant: "primary" },
                  styles: {
                    backgroundColor: "#6366F1",
                    backgroundToken: "accent.primary",
                    color: "#FFFFFF",
                    borderRadius: 8,
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingTop: 8,
                    paddingBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                  },
                  children: [],
                },
              ],
            },
          ],
        },

        // Main Body Content (Padding & Grid)
        {
          id: "node_main_container",
          name: "Main Content Layout",
          type: "flex_col",
          props: {},
          styles: {
            width: "100%",
            maxWidth: 1400,
            marginLeft: "auto",
            marginRight: "auto",
            paddingTop: 28,
            paddingBottom: 48,
            paddingLeft: 24,
            paddingRight: 24,
            gap: 28,
          },
          children: [
            // Header Title Block
            {
              id: "node_page_header",
              name: "Page Header",
              type: "flex_col",
              props: {},
              styles: { gap: 6 },
              children: [
                {
                  id: "node_header_title",
                  name: "Dashboard Title",
                  type: "text",
                  textContent: "Operational Command Center",
                  props: {},
                  styles: { fontSize: 24, fontWeight: 700, color: "#F3F6FC" },
                  children: [],
                },
                {
                  id: "node_header_desc",
                  name: "Dashboard Description",
                  type: "text",
                  textContent: spec.summary,
                  props: {},
                  styles: { fontSize: 14, color: "#9DA8C3" },
                  children: [],
                },
              ],
            },

            // 4x KPI Summary Cards Row
            {
              id: "node_kpi_grid",
              name: "KPI Metrics Row",
              type: "grid",
              props: {},
              styles: {
                gridColumns: 4,
                gap: 16,
                width: "100%",
              },
              children: [
                this.createKPICard("card_kpi_1", "Total Processed Volume", "14,892", "+12.4% vs last week", "#10B981"),
                this.createKPICard("card_kpi_2", "Active Exceptions", "23", "3 require urgent review", "#EF4444"),
                this.createKPICard("card_kpi_3", "Average SLA Duration", "4m 12s", "-18s faster", "#10B981"),
                this.createKPICard("card_kpi_4", "Automation Rate", "98.2%", "+1.5% optimized", "#6366F1"),
              ],
            },

            // Data Table Section
            {
              id: "node_table_card",
              name: "Recent Records Table Container",
              type: "card",
              props: {},
              styles: {
                backgroundColor: "#121520",
                backgroundToken: "bg.surface",
                borderColor: "#1E2538",
                borderToken: "border.subtle",
                borderWidth: 1,
                borderRadius: 12,
                paddingTop: 20,
                paddingBottom: 20,
                paddingLeft: 24,
                paddingRight: 24,
                gap: 16,
              },
              children: [
                {
                  id: "node_table_header",
                  name: "Table Controls Header",
                  type: "flex_row",
                  props: {},
                  styles: {
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  },
                  children: [
                    {
                      id: "node_table_heading",
                      name: "Section Title",
                      type: "text",
                      textContent: "Active Dispatch Pipeline",
                      props: {},
                      styles: { fontSize: 16, fontWeight: 600, color: "#F3F6FC" },
                      children: [],
                    },
                    {
                      id: "node_filter_chips",
                      name: "Filter Tabs",
                      type: "flex_row",
                      props: {},
                      styles: { gap: 8 },
                      children: [
                        {
                          id: "node_tab_all",
                          name: "Filter Tab All",
                          type: "badge",
                          textContent: "All (148)",
                          props: {},
                          styles: {
                            backgroundColor: "#1A1F30",
                            color: "#F3F6FC",
                            borderRadius: 6,
                            paddingLeft: 10,
                            paddingRight: 10,
                            paddingTop: 4,
                            paddingBottom: 4,
                            fontSize: 12,
                          },
                          children: [],
                        },
                        {
                          id: "node_tab_attention",
                          name: "Filter Tab Attention",
                          type: "badge",
                          textContent: "Needs Attention (23)",
                          props: {},
                          styles: {
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            color: "#EF4444",
                            borderRadius: 6,
                            paddingLeft: 10,
                            paddingRight: 10,
                            paddingTop: 4,
                            paddingBottom: 4,
                            fontSize: 12,
                            fontWeight: 600,
                          },
                          children: [],
                        },
                      ],
                    },
                  ],
                },

                // Mock Data Table Rows
                {
                  id: "node_table_rows_container",
                  name: "Table Rows",
                  type: "flex_col",
                  props: {},
                  styles: { gap: 8, width: "100%" },
                  children: [
                    this.createTableRow("row_1", "REC-9402", "Northwest Logistics Center", "In Transit", "On Schedule", "#10B981"),
                    this.createTableRow("row_2", "REC-9403", "Metro Cross-Dock Terminal", "Exception Alert", "Driver Reroute", "#EF4444"),
                    this.createTableRow("row_3", "REC-9404", "Central Cargo Hub", "Pending Dispatch", "Awaiting Gate Pass", "#F59E0B"),
                    this.createTableRow("row_4", "REC-9405", "Eastern Express Waypoint", "Delivered", "Signed by Recipient", "#10B981"),
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    return {
      screenId,
      title: `${spec.title} - Operational Dashboard`,
      route: "/dashboard",
      purpose: "Primary command center for monitoring operational metrics and resolving pipeline exceptions.",
      viewports: ["desktop", "tablet", "mobile"],
      rootNode: normalizeToAutoLayout(rootNode),
    };
  }

  private createKPICard(
    id: string,
    title: string,
    value: string,
    subtitle: string,
    subtitleColor: string
  ): LayoutNode {
    return {
      id,
      name: `KPI Card: ${title}`,
      type: "card",
      props: {},
      styles: {
        backgroundColor: "#121520",
        backgroundToken: "bg.surface",
        borderColor: "#1E2538",
        borderToken: "border.subtle",
        borderWidth: 1,
        borderRadius: 12,
        paddingTop: 18,
        paddingBottom: 18,
        paddingLeft: 20,
        paddingRight: 20,
        gap: 8,
      },
      children: [
        {
          id: `${id}_title`,
          name: "Metric Title",
          type: "text",
          textContent: title,
          props: {},
          styles: { fontSize: 13, color: "#9DA8C3", fontWeight: 500 },
          children: [],
        },
        {
          id: `${id}_val`,
          name: "Metric Value",
          type: "text",
          textContent: value,
          props: {},
          styles: { fontSize: 28, fontWeight: 700, color: "#F3F6FC" },
          children: [],
        },
        {
          id: `${id}_sub`,
          name: "Metric Subtitle",
          type: "text",
          textContent: subtitle,
          props: {},
          styles: { fontSize: 12, color: subtitleColor, fontWeight: 500 },
          children: [],
        },
      ],
    };
  }

  private createTableRow(
    id: string,
    refCode: string,
    location: string,
    statusText: string,
    detailText: string,
    statusColor: string
  ): LayoutNode {
    return {
      id,
      name: `Row: ${refCode}`,
      type: "flex_row",
      props: {},
      styles: {
        backgroundColor: "#161B29",
        borderRadius: 8,
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 16,
        paddingRight: 16,
        alignItems: "center",
        justifyContent: "space-between",
        borderColor: "#1E2538",
        borderWidth: 1,
      },
      children: [
        {
          id: `${id}_col1`,
          name: "Reference & Location",
          type: "flex_col",
          props: {},
          styles: { gap: 2 },
          children: [
            {
              id: `${id}_ref`,
              name: "Ref Code",
              type: "text",
              textContent: refCode,
              props: {},
              styles: { fontSize: 13, fontWeight: 600, color: "#6366F1" },
              children: [],
            },
            {
              id: `${id}_loc`,
              name: "Location",
              type: "text",
              textContent: location,
              props: {},
              styles: { fontSize: 13, color: "#F3F6FC" },
              children: [],
            },
          ],
        },
        {
          id: `${id}_col2`,
          name: "Status & Detail",
          type: "flex_col",
          props: {},
          styles: { alignItems: "flex-end", gap: 2 },
          children: [
            {
              id: `${id}_status`,
              name: "Status Badge",
              type: "badge",
              textContent: statusText,
              props: {},
              styles: {
                color: statusColor,
                fontSize: 12,
                fontWeight: 600,
              },
              children: [],
            },
            {
              id: `${id}_detail`,
              name: "Detail Note",
              type: "text",
              textContent: detailText,
              props: {},
              styles: { fontSize: 12, color: "#9DA8C3" },
              children: [],
            },
          ],
        },
      ],
    };
  }
}
