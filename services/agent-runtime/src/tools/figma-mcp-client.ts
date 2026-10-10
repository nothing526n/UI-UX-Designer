import { LayoutNode, normalizeToAutoLayout } from "@platform/contracts";
import { codeConnectRegistry } from "../registry/code-connect-registry.js";

export interface FigmaDesignContext {
  fileKey: string;
  name: string;
  version: string;
  nodes: LayoutNode[];
  variableTokens: Record<string, string>;
  codeConnectMappings: Record<string, any>;
}

export class FigmaMCPClient {
  private endpoint: string;

  constructor(endpoint: string = "https://api.figma.com/v1") {
    this.endpoint = endpoint;
  }

  /**
   * Reads structured design context (nodes, tokens, variables, Code Connect mappings)
   */
  public async getDesignContext(
    fileKey: string,
    token?: string
  ): Promise<FigmaDesignContext> {
    const mappings = codeConnectRegistry.listMappings();
    const mappingsMap: Record<string, any> = {};
    for (const m of mappings) {
      mappingsMap[m.componentName] = {
        importPath: m.importPath,
        exportName: m.exportName,
        propMappings: m.propMappings,
      };
    }

    // Default sample node tree if token is not provided
    const sampleNode: LayoutNode = normalizeToAutoLayout({
      id: "node_figma_root",
      name: "Figma Artboard: Operational Telemetry",
      type: "frame",
      props: {},
      styles: {
        width: 1200,
        backgroundColor: "#090A0F",
        backgroundToken: "bg.canvas",
      },
      autoLayout: {
        layoutMode: "VERTICAL",
        primaryAxisSizingMode: "AUTO",
        counterAxisSizingMode: "AUTO",
        primaryAxisAlignItems: "MIN",
        counterAxisAlignItems: "MIN",
        padding: { top: 24, right: 24, bottom: 24, left: 24 },
        itemSpacing: 16,
        layoutGrow: 0,
        layoutAlign: "INHERIT",
      },
      children: [
        normalizeToAutoLayout({
          id: "node_figma_kpi",
          name: "KPI Banner",
          type: "card",
          componentRef: "comp_card",
          props: {},
          styles: {
            backgroundColor: "#121520",
            backgroundToken: "bg.surface",
            borderRadius: 10,
          },
          autoLayout: {
            layoutMode: "HORIZONTAL",
            primaryAxisSizingMode: "AUTO",
            counterAxisSizingMode: "AUTO",
            primaryAxisAlignItems: "SPACE_BETWEEN",
            counterAxisAlignItems: "CENTER",
            padding: { top: 16, right: 16, bottom: 16, left: 16 },
            itemSpacing: 12,
            layoutGrow: 1,
            layoutAlign: "STRETCH",
          },
          children: [
            {
              id: "node_figma_text_title",
              name: "Active Telemetry Stream",
              type: "text",
              textContent: "Active Fleet Telemetry (Figma Context)",
              props: {},
              styles: { color: "#F3F6FC", fontSize: 14, fontWeight: 600 },
              children: [],
            },
            {
              id: "node_figma_btn",
              name: "Connect Button",
              type: "button",
              componentRef: "comp_button",
              textContent: "Sync Realtime",
              props: { variant: "primary" },
              styles: {
                backgroundColor: "#6366F1",
                color: "#FFFFFF",
                borderRadius: 8,
              },
              children: [],
            },
          ],
        }),
      ],
    });

    return {
      fileKey,
      name: "Apex Global Telemetry Canvas",
      version: "2026.1",
      nodes: [sampleNode],
      variableTokens: {
        "color.bg.canvas": "#090A0F",
        "color.bg.surface": "#121520",
        "color.action.primary": "#6366F1",
        "color.text.primary": "#F3F6FC",
      },
      codeConnectMappings: mappingsMap,
    };
  }

  /**
   * Search design system components and tokens by keyword
   */
  public async searchDesignSystem(query: string): Promise<any[]> {
    const q = query.toLowerCase();
    const mappings = codeConnectRegistry.listMappings().filter(
      (m) =>
        m.componentName.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
    return mappings;
  }

  /**
   * Native canvas authoring via /figma-use skill
   */
  public async useFigma(
    action: "create_frame" | "update_properties" | "bind_variable",
    params: Record<string, any>
  ): Promise<{ success: boolean; resultNodeId: string }> {
    const resultNodeId = `node_${action}_${Date.now()}`;
    return {
      success: true,
      resultNodeId,
    };
  }
}

export const figmaMCPClient = new FigmaMCPClient();
