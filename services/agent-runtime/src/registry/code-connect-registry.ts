import { CodeConnectMapping, CodeConnectManifest } from "@platform/contracts";

/**
 * Pre-mapped canonical Shadcn / Tailwind component definitions
 */
export const defaultShadcnMappings: CodeConnectMapping[] = [
  {
    id: "map_button",
    figmaNodeId: "comp_button",
    componentName: "Button",
    exportName: "Button",
    importPath: "@/components/ui/button",
    sourcePackage: "@platform/ui",
    description: "Standard interactive action button with variant and size states",
    propMappings: [
      {
        figmaProp: "variant",
        codeProp: "variant",
        type: "enum",
        valueMap: {
          primary: "default",
          secondary: "secondary",
          outline: "outline",
          ghost: "ghost",
          destructive: "destructive",
        },
        defaultValue: "default",
      },
      {
        figmaProp: "size",
        codeProp: "size",
        type: "enum",
        valueMap: { sm: "sm", md: "default", lg: "lg", icon: "icon" },
        defaultValue: "default",
      },
      {
        figmaProp: "disabled",
        codeProp: "disabled",
        type: "boolean",
        defaultValue: false,
      },
    ],
    template: '<Button variant="{variant}" size="{size}">{textContent}</Button>',
  },
  {
    id: "map_card",
    figmaNodeId: "comp_card",
    componentName: "Card",
    exportName: "Card",
    importPath: "@/components/ui/card",
    sourcePackage: "@platform/ui",
    description: "Elevated container surface for KPI metrics, data tables, and groupings",
    propMappings: [
      {
        figmaProp: "elevation",
        codeProp: "className",
        type: "string",
        valueMap: {
          sm: "shadow-sm border-subtle",
          md: "shadow-md border-subtle",
          lg: "shadow-xl border-borderStrong",
        },
        defaultValue: "shadow-sm",
      },
    ],
    template: '<Card className="{className}">{children}</Card>',
  },
  {
    id: "map_badge",
    figmaNodeId: "comp_badge",
    componentName: "Badge",
    exportName: "Badge",
    importPath: "@/components/ui/badge",
    sourcePackage: "@platform/ui",
    description: "Compact status pill and numerical indicator",
    propMappings: [
      {
        figmaProp: "intent",
        codeProp: "variant",
        type: "enum",
        valueMap: {
          success: "success",
          warning: "warning",
          error: "destructive",
          neutral: "outline",
        },
        defaultValue: "outline",
      },
    ],
    template: '<Badge variant="{variant}">{textContent}</Badge>',
  },
  {
    id: "map_input",
    figmaNodeId: "comp_input",
    componentName: "Input",
    exportName: "Input",
    importPath: "@/components/ui/input",
    sourcePackage: "@platform/ui",
    description: "Text input with focus ring and clearable states",
    propMappings: [
      {
        figmaProp: "placeholder",
        codeProp: "placeholder",
        type: "string",
        defaultValue: "Search or enter value...",
      },
      {
        figmaProp: "disabled",
        codeProp: "disabled",
        type: "boolean",
        defaultValue: false,
      },
    ],
    template: '<Input placeholder="{placeholder}" disabled={disabled} />',
  },
  {
    id: "map_table",
    figmaNodeId: "comp_table",
    componentName: "Table",
    exportName: "Table",
    importPath: "@/components/ui/table",
    sourcePackage: "@platform/ui",
    description: "High-density data grid with sortable headers and row selection",
    propMappings: [],
    template: '<Table>{children}</Table>',
  },
];

export class CodeConnectRegistry {
  private mappings = new Map<string, CodeConnectMapping>();
  private libraryName: string = "shadcn-tailwind-hybrid";

  constructor(initialMappings: CodeConnectMapping[] = defaultShadcnMappings) {
    for (const m of initialMappings) {
      this.registerMapping(m);
    }
  }

  public registerMapping(mapping: CodeConnectMapping): void {
    this.mappings.set(mapping.componentName.toLowerCase(), mapping);
    if (mapping.figmaNodeId) {
      this.mappings.set(mapping.figmaNodeId.toLowerCase(), mapping);
    }
    this.mappings.set(mapping.id.toLowerCase(), mapping);
  }

  public getMapping(componentRefOrName: string): CodeConnectMapping | undefined {
    return this.mappings.get(componentRefOrName.toLowerCase());
  }

  public get(componentRefOrName: string): CodeConnectMapping | undefined {
    return this.getMapping(componentRefOrName);
  }

  public listMappings(): CodeConnectMapping[] {
    const unique = new Map<string, CodeConnectMapping>();
    for (const m of this.mappings.values()) {
      unique.set(m.id, m);
    }
    return Array.from(unique.values());
  }

  public getAll(): CodeConnectMapping[] {
    return this.listMappings();
  }

  public loadManifest(manifest: CodeConnectManifest): void {
    this.libraryName = manifest.libraryName;
    for (const m of manifest.mappings) {
      this.registerMapping(m);
    }
  }

  public exportManifest(): CodeConnectManifest {
    return {
      version: "1.0.0",
      libraryName: this.libraryName,
      mappings: this.listMappings(),
    };
  }

  public generateTsxSnippet(
    componentName: string,
    props: Record<string, any> = {}
  ): string {
    const mapping = this.getMapping(componentName);
    if (!mapping) return `<${componentName} />`;
    const transformed = this.transformProps(componentName, props);
    const attrs = Object.entries(transformed)
      .filter(([k]) => k !== "children" && k !== "textContent")
      .map(([k, v]) =>
        typeof v === "boolean"
          ? v
            ? k
            : ""
          : typeof v === "string"
          ? `${k}="${v}"`
          : `${k}={${JSON.stringify(v)}}`
      )
      .filter(Boolean)
      .join(" ");
    const content = props.children ?? props.textContent ?? "";
    const space = attrs.length > 0 ? ` ${attrs}` : "";
    return content
      ? `<${mapping.componentName}${space}>${content}</${mapping.componentName}>`
      : `<${mapping.componentName}${space} />`;
  }

  /**
   * Transforms raw design layout props into clean code props based on mapping contracts
   */
  public transformProps(
    componentRefOrName: string,
    designProps: Record<string, any> = {}
  ): Record<string, any> {
    const mapping = this.getMapping(componentRefOrName);
    if (!mapping) return { ...designProps };

    const transformed: Record<string, any> = {};

    for (const p of mapping.propMappings) {
      const designVal = designProps[p.figmaProp];
      if (designVal !== undefined) {
        if (p.valueMap && p.valueMap[designVal] !== undefined) {
          transformed[p.codeProp] = p.valueMap[designVal];
        } else {
          transformed[p.codeProp] = designVal;
        }
      } else if (p.defaultValue !== undefined) {
        transformed[p.codeProp] = p.defaultValue;
      }
    }

    return transformed;
  }
}

export const codeConnectRegistry = new CodeConnectRegistry();
