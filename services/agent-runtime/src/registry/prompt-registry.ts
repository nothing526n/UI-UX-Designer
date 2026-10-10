export interface PromptTemplateVersion {
  version: number;
  templateString: string;
  requiredVariables: string[];
  status: "active" | "draft" | "deprecated";
  createdAt: string;
}

export interface PromptTemplateRecord {
  id: string;
  name: string;
  description: string;
  activeVersion: number;
  versions: Map<number, PromptTemplateVersion>;
}

export class PromptRegistry {
  private templates = new Map<string, PromptTemplateRecord>();

  constructor() {
    this.seedCanonicalTemplates();
  }

  public registerTemplate(
    id: string,
    name: string,
    description: string,
    templateString: string,
    requiredVariables: string[],
    version: number = 1
  ): PromptTemplateRecord {
    let record = this.templates.get(id);
    if (!record) {
      record = {
        id,
        name,
        description,
        activeVersion: version,
        versions: new Map(),
      };
      this.templates.set(id, record);
    }

    record.versions.set(version, {
      version,
      templateString,
      requiredVariables,
      status: "active",
      createdAt: new Date().toISOString(),
    });
    record.activeVersion = version;
    return record;
  }

  public getTemplate(id: string, version?: number): PromptTemplateVersion | undefined {
    const record = this.templates.get(id);
    if (!record) return undefined;
    const v = version ?? record.activeVersion;
    return record.versions.get(v);
  }

  public listTemplates(): Array<{ id: string; name: string; activeVersion: number; description: string }> {
    return Array.from(this.templates.values()).map((t) => ({
      id: t.id,
      name: t.name,
      activeVersion: t.activeVersion,
      description: t.description,
    }));
  }

  /**
   * Interpolates template string with variables: {{variableName}}
   */
  public interpolate(id: string, variables: Record<string, any>, version?: number): string {
    const tmpl = this.getTemplate(id, version);
    if (!tmpl) {
      throw new Error(`Prompt template '${id}' not found in registry`);
    }

    // Verify required variables
    for (const reqVar of tmpl.requiredVariables) {
      if (variables[reqVar] === undefined || variables[reqVar] === null) {
        throw new Error(`Missing required template variable '${reqVar}' for prompt '${id}'`);
      }
    }

    let rendered = tmpl.templateString;
    for (const [k, v] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${k}\\s*}}`, "g");
      rendered = rendered.replace(regex, typeof v === "object" ? JSON.stringify(v, null, 2) : String(v));
    }

    return rendered;
  }

  private seedCanonicalTemplates() {
    this.registerTemplate(
      "requirements-synthesis",
      "Product Requirements Synthesis",
      "Extracts actors, features, priorities and acceptance criteria from prompt",
      "You are a Principal Product Manager. Synthesize the following natural-language product brief into a structured ProductSpec schema:\n\nUSER BRIEF:\n{{prompt}}\n\nTARGET PLATFORMS:\n{{targetPlatforms}}",
      ["prompt", "targetPlatforms"]
    );

    this.registerTemplate(
      "ux-research",
      "UX Research & Persona Generation",
      "Generates target personas and end-to-end user journeys",
      "You are a Lead UX Researcher. Based on the following ProductSpec, generate comprehensive user personas and customer journeys:\n\nPRODUCT SPEC:\n{{specJson}}",
      ["specJson"]
    );

    this.registerTemplate(
      "ui-scene-generation",
      "High-Fidelity UI Layout Scene Generator",
      "Constructs hierarchical responsive LayoutNode scene trees using design tokens",
      "You are a World-Class UI/UX Designer. Generate a production-grade LayoutNode AST tree conforming to our design tokens for screen '{{screenTitle}}':\n\nPRODUCT SPEC:\n{{specJson}}\n\nDESIGN TOKENS:\n{{tokenJson}}",
      ["screenTitle", "specJson", "tokenJson"]
    );

    this.registerTemplate(
      "frontend-code-generation",
      "Next.js 14 Code Transpilation",
      "Transpiles LayoutNode scene trees into production TypeScript Next.js 14 App Router code",
      "You are a Senior Frontend Staff Engineer. Convert the following Screen AST into production Next.js 14 App Router code with Tailwind CSS:\n\nSCREEN AST:\n{{screenAst}}",
      ["screenAst"]
    );
  }
}

export const promptRegistry = new PromptRegistry();
