import {
  DesignSystemContent,
  ComponentDefinition,
} from "@platform/contracts";
import { defaultTokens, defaultVariableCollections } from "@platform/design-system";

export class DesignSystemAgent {
  public async generateDesignSystem(brandName: string = "Platform Studio"): Promise<DesignSystemContent> {
    const components: ComponentDefinition[] = [
      {
        id: "comp_button",
        name: "Button",
        category: "actions",
        description: "Standard action button with variants, sizes, and loading state.",
        props: [
          { name: "variant", type: "enum", options: ["primary", "secondary", "ghost", "danger"], defaultValue: "primary" },
          { name: "size", type: "enum", options: ["sm", "md", "lg"], defaultValue: "md" },
          { name: "disabled", type: "boolean", defaultValue: false },
          { name: "loading", type: "boolean", defaultValue: false },
        ],
        supportedStates: ["default", "hover", "focus", "active", "disabled", "loading"],
        accessibility: {
          role: "button",
          ariaLabelRequirement: false,
          keyboardAccessible: true,
          notes: "Focus visible ring using --border-strong token. Target min-height 40px.",
        },
        codeMapping: {
          exportName: "Button",
          importPath: "@/components/ui/button",
        },
      },
      {
        id: "comp_badge",
        name: "Badge",
        category: "data_display",
        description: "Compact status indicator badge with semantic color fills.",
        props: [
          { name: "status", type: "enum", options: ["success", "warning", "error", "info", "neutral"], defaultValue: "neutral" },
          { name: "size", type: "enum", options: ["sm", "md"], defaultValue: "md" },
        ],
        supportedStates: ["default"],
        accessibility: {
          role: "status",
          ariaLabelRequirement: false,
          keyboardAccessible: false,
          notes: "Text contrast ratio > 4.5:1 against background fill.",
        },
        codeMapping: {
          exportName: "Badge",
          importPath: "@/components/ui/badge",
        },
      },
      {
        id: "comp_card",
        name: "Card",
        category: "layout",
        description: "Structured surface container for grouping metrics, forms, and charts.",
        props: [
          { name: "hoverable", type: "boolean", defaultValue: false },
          { name: "padding", type: "enum", options: ["sm", "md", "lg"], defaultValue: "md" },
        ],
        supportedStates: ["default", "hover"],
        accessibility: {
          role: "region",
          ariaLabelRequirement: false,
          keyboardAccessible: false,
          notes: "Contains subtle border to clearly demarcate boundary in dark mode.",
        },
        codeMapping: {
          exportName: "Card",
          importPath: "@/components/ui/card",
        },
      },
      {
        id: "comp_input",
        name: "TextInput",
        category: "inputs",
        description: "Accessible text input field with optional prefix/suffix icons and error state.",
        props: [
          { name: "size", type: "enum", options: ["sm", "md", "lg"], defaultValue: "md" },
          { name: "error", type: "boolean", defaultValue: false },
          { name: "disabled", type: "boolean", defaultValue: false },
        ],
        supportedStates: ["default", "focus", "error", "disabled"],
        accessibility: {
          role: "textbox",
          ariaLabelRequirement: true,
          keyboardAccessible: true,
          notes: "Explicit label association required. Error message announced via aria-describedby.",
        },
        codeMapping: {
          exportName: "TextInput",
          importPath: "@/components/ui/input",
        },
      },
    ];

    return {
      name: `${brandName} Design System`,
      version: "1.0.0",
      description: "Production design system optimized for high-density command centers and dark-mode dashboards.",
      tokens: defaultTokens,
      collections: defaultVariableCollections,
      activeModeId: "mode_dark",
      components,
      consistencyRules: [
        "Never use raw hex colors; bind directly to semantic tokens (bg.canvas, bg.surface, text.primary).",
        "Maintain an 8px base spacing grid (space.1 to space.12).",
        "All interactive controls must have an explicit focus ring token (border.strong).",
        "Minimum touch target for mobile viewports is 44x44px.",
      ],
    };
  }
}
