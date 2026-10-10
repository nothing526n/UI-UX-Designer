import { z } from "zod";

export const TokenCategoryEnum = z.enum([
  "color",
  "spacing",
  "typography",
  "radius",
  "elevation",
  "motion",
  "breakpoint",
]);
export type TokenCategory = z.infer<typeof TokenCategoryEnum>;

export const DesignTokenSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g. "bg.canvas", "accent.primary", "space.4"
  category: TokenCategoryEnum,
  value: z.string(), // e.g. "#090A0F", "16px", "Inter, sans-serif"
  cssVariable: z.string().optional(), // e.g. "--bg-canvas"
  description: z.string().optional(),
  isDarkVariant: z.boolean().default(false).optional(),
});
export type DesignToken = z.infer<typeof DesignTokenSchema>;

export const ComponentVariantPropSchema = z.object({
  name: z.string(), // e.g. "size", "intent", "state"
  type: z.enum(["string", "boolean", "enum"]),
  options: z.array(z.string()).optional(), // e.g. ["sm", "md", "lg"]
  defaultValue: z.any(),
});
export type ComponentVariantProp = z.infer<typeof ComponentVariantPropSchema>;

export const ComponentDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g. "Button", "Card", "TextInput"
  category: z.enum([
    "actions",
    "inputs",
    "navigation",
    "data_display",
    "feedback",
    "layout",
  ]),
  description: z.string(),
  props: z.array(ComponentVariantPropSchema),
  supportedStates: z.array(
    z.enum(["default", "hover", "focus", "active", "disabled", "loading", "error"])
  ),
  accessibility: z.object({
    role: z.string().optional(),
    ariaLabelRequirement: z.boolean().default(false),
    keyboardAccessible: z.boolean().default(true),
    notes: z.string().optional(),
  }),
  codeMapping: z.object({
    exportName: z.string(),
    importPath: z.string(),
  }).optional(),
});
export type ComponentDefinition = z.infer<typeof ComponentDefinitionSchema>;

export const VariableTypeEnum = z.enum(["COLOR", "FLOAT", "STRING", "BOOLEAN"]);
export type VariableType = z.infer<typeof VariableTypeEnum>;

export const VariableTierEnum = z.enum(["primitive", "semantic", "component"]);
export type VariableTier = z.infer<typeof VariableTierEnum>;

export const VariableModeSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g. "Dark", "Light", "Compact"
});
export type VariableMode = z.infer<typeof VariableModeSchema>;

export const VariableDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g. "color.action.primary", "palette.indigo.500"
  type: VariableTypeEnum,
  tier: VariableTierEnum.default("semantic"),
  valuesByMode: z.record(z.union([z.string(), z.number(), z.boolean()])), // modeId -> value
  aliasOf: z.string().optional(), // id of variable it aliases
  cssVariable: z.string().optional(), // e.g. "--color-action-primary"
  description: z.string().optional(),
});
export type VariableDefinition = z.infer<typeof VariableDefinitionSchema>;

export const VariableCollectionSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g. "Brand Tokens", "Semantic UI", "Layout Dimensions"
  modes: z.array(VariableModeSchema),
  defaultModeId: z.string(),
  variables: z.array(VariableDefinitionSchema),
});
export type VariableCollection = z.infer<typeof VariableCollectionSchema>;

export const DesignSystemContentSchema = z.object({
  name: z.string(),
  version: z.string().default("1.0.0"),
  description: z.string().optional(),
  tokens: z.array(DesignTokenSchema),
  collections: z.array(VariableCollectionSchema).default([]),
  activeModeId: z.string().optional(),
  components: z.array(ComponentDefinitionSchema),
  consistencyRules: z.array(z.string()).default([]),
});
export type DesignSystemContent = z.infer<typeof DesignSystemContentSchema>;

