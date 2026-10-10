import { z } from "zod";

export const PropMappingTypeEnum = z.enum([
  "string",
  "boolean",
  "enum",
  "children",
  "instance",
  "callback",
]);
export type PropMappingType = z.infer<typeof PropMappingTypeEnum>;

export const PropMappingDefinitionSchema = z.object({
  figmaProp: z.string(), // e.g. "variant", "size", "disabled"
  codeProp: z.string(), // e.g. "variant", "size", "disabled"
  type: PropMappingTypeEnum,
  valueMap: z.record(z.any()).optional(), // maps Figma variant option to code prop value
  defaultValue: z.any().optional(),
});
export type PropMappingDefinition = z.infer<typeof PropMappingDefinitionSchema>;

export const CodeConnectMappingSchema = z.object({
  id: z.string(),
  figmaNodeId: z.string().optional(), // Figma Component ID or native componentRef e.g. "comp_button"
  componentName: z.string(), // e.g. "Button"
  exportName: z.string(), // e.g. "Button"
  importPath: z.string(), // e.g. "@/components/ui/button"
  sourcePackage: z.string().default("@/components/ui"),
  propMappings: z.array(PropMappingDefinitionSchema).default([]),
  template: z.string().optional(), // e.g. '<Button variant="{variant}" size="{size}">{children}</Button>'
  description: z.string().optional(),
});
export type CodeConnectMapping = z.infer<typeof CodeConnectMappingSchema>;

export const CodeConnectManifestSchema = z.object({
  version: z.string().default("1.0.0"),
  libraryName: z.string().default("default"),
  mappings: z.array(CodeConnectMappingSchema),
});
export type CodeConnectManifest = z.infer<typeof CodeConnectManifestSchema>;
