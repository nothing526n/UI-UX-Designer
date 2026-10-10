import { z } from "zod";

export const NodeTypeEnum = z.enum([
  "frame",
  "flex_row",
  "flex_col",
  "grid",
  "text",
  "button",
  "input",
  "image",
  "icon",
  "card",
  "badge",
  "table",
  "chart",
  "component_instance",
]);
export type NodeType = z.infer<typeof NodeTypeEnum>;

export const StylePropertiesSchema = z.object({
  // Dimensions
  width: z.union([z.number(), z.string()]).optional(), // e.g. "100%", "auto", 320
  height: z.union([z.number(), z.string()]).optional(),
  minWidth: z.union([z.number(), z.string()]).optional(),
  maxWidth: z.union([z.number(), z.string()]).optional(),

  // Spacing
  paddingTop: z.union([z.number(), z.string()]).optional(),
  paddingRight: z.union([z.number(), z.string()]).optional(),
  paddingBottom: z.union([z.number(), z.string()]).optional(),
  paddingLeft: z.union([z.number(), z.string()]).optional(),
  marginTop: z.union([z.number(), z.string()]).optional(),
  marginRight: z.union([z.number(), z.string()]).optional(),
  marginBottom: z.union([z.number(), z.string()]).optional(),
  marginLeft: z.union([z.number(), z.string()]).optional(),
  gap: z.union([z.number(), z.string()]).optional(),

  // Flex/Grid
  alignItems: z.enum(["flex-start", "center", "flex-end", "stretch", "baseline"]).optional(),
  justifyContent: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around"]).optional(),
  flexWrap: z.enum(["nowrap", "wrap"]).optional(),
  gridColumns: z.number().optional(),

  // Colors & Fills
  backgroundColor: z.string().optional(),
  backgroundToken: z.string().optional(), // token ref e.g. "bg.surface"
  borderColor: z.string().optional(),
  borderToken: z.string().optional(),
  borderWidth: z.number().optional(),
  borderRadius: z.number().optional(),
  radiusToken: z.string().optional(),

  // Typography
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.union([z.number(), z.string()]).optional(),
  color: z.string().optional(),
  colorToken: z.string().optional(),
  lineHeight: z.union([z.number(), z.string()]).optional(),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),

  // Effects
  boxShadow: z.string().optional(),
  elevationToken: z.string().optional(),
  opacity: z.number().optional(),
});
export type StyleProperties = z.infer<typeof StylePropertiesSchema>;

export const LayoutModeEnum = z.enum(["NONE", "HORIZONTAL", "VERTICAL"]);
export type LayoutMode = z.infer<typeof LayoutModeEnum>;

export const SizingModeEnum = z.enum(["FIXED", "AUTO"]);
export type SizingMode = z.infer<typeof SizingModeEnum>;

export const LayoutAlignEnum = z.enum(["INHERIT", "STRETCH", "MIN", "CENTER", "MAX"]);
export type LayoutAlign = z.infer<typeof LayoutAlignEnum>;

export const PrimaryAxisAlignItemsEnum = z.enum(["MIN", "CENTER", "MAX", "SPACE_BETWEEN"]);
export type PrimaryAxisAlignItems = z.infer<typeof PrimaryAxisAlignItemsEnum>;

export const CounterAxisAlignItemsEnum = z.enum(["MIN", "CENTER", "MAX", "BASELINE"]);
export type CounterAxisAlignItems = z.infer<typeof CounterAxisAlignItemsEnum>;

export const ConstraintsSchema = z.object({
  horizontal: z.enum(["MIN", "CENTER", "MAX", "STRETCH", "SCALE"]).default("MIN"),
  vertical: z.enum(["MIN", "CENTER", "MAX", "STRETCH", "SCALE"]).default("MIN"),
});
export type Constraints = z.infer<typeof ConstraintsSchema>;

export const AutoLayoutPaddingSchema = z.object({
  top: z.number().default(0),
  right: z.number().default(0),
  bottom: z.number().default(0),
  left: z.number().default(0),
});
export type AutoLayoutPadding = z.infer<typeof AutoLayoutPaddingSchema>;

export const AutoLayoutPropertiesSchema = z.object({
  layoutMode: LayoutModeEnum.default("NONE"),
  primaryAxisSizingMode: SizingModeEnum.default("AUTO"), // AUTO = Hug contents, FIXED = explicit px
  counterAxisSizingMode: SizingModeEnum.default("AUTO"), // AUTO = Hug contents, FIXED = explicit px
  primaryAxisAlignItems: PrimaryAxisAlignItemsEnum.default("MIN"),
  counterAxisAlignItems: CounterAxisAlignItemsEnum.default("MIN"),
  padding: AutoLayoutPaddingSchema.default({ top: 0, right: 0, bottom: 0, left: 0 }),
  itemSpacing: z.number().default(0), // gap
  layoutGrow: z.number().default(0), // 0 = fixed/hug, 1 = fill container
  layoutAlign: LayoutAlignEnum.default("INHERIT"),
  constraints: ConstraintsSchema.optional(),
});
export type AutoLayoutProperties = z.infer<typeof AutoLayoutPropertiesSchema>;

export const LayoutNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    type: NodeTypeEnum,
    componentRef: z.string().optional(), // ID of design system component if instance
    componentId: z.string().optional(),
    textContent: z.string().optional(),
    iconName: z.string().optional(),
    props: z.record(z.any()).default({}),
    styles: StylePropertiesSchema.default({}),
    autoLayout: AutoLayoutPropertiesSchema.optional(),
    componentPropertyReferences: z.record(z.string()).optional(),
    children: z.array(LayoutNodeSchema).default([]),
    responsiveOverrides: z
      .record(z.object({ styles: StylePropertiesSchema.optional(), autoLayout: AutoLayoutPropertiesSchema.optional() }))
      .optional(),
  })
);
export type LayoutNode = {
  id: string;
  name: string;
  type: NodeType;
  componentRef?: string;
  componentId?: string;
  textContent?: string;
  iconName?: string;
  props: Record<string, any>;
  styles: StyleProperties;
  autoLayout?: AutoLayoutProperties;
  componentPropertyReferences?: Record<string, string>;
  children: LayoutNode[];
  responsiveOverrides?: Record<string, { styles?: StyleProperties; autoLayout?: AutoLayoutProperties }>;
};

/**
 * Adapter utility that ensures any legacy LayoutNode has valid Figma Auto Layout properties
 */
export function normalizeToAutoLayout(node: LayoutNode): LayoutNode {
  const anyNode = node as any;
  let layoutMode: LayoutMode = "NONE";
  if (node.type === "flex_row") {
    layoutMode = "HORIZONTAL";
  } else if (
    node.type === "flex_col" ||
    node.type === "card" ||
    node.type === "frame" ||
    anyNode.type === "CONTAINER" ||
    (node.children && node.children.length > 0)
  ) {
    layoutMode = "VERTICAL";
  } else if (node.autoLayout?.layoutMode) {
    layoutMode = node.autoLayout.layoutMode;
  }

  const padTop = typeof node.styles?.paddingTop === "number" ? node.styles.paddingTop : 0;
  const padRight = typeof node.styles?.paddingRight === "number" ? node.styles.paddingRight : 0;
  const padBottom = typeof node.styles?.paddingBottom === "number" ? node.styles.paddingBottom : 0;
  const padLeft = typeof node.styles?.paddingLeft === "number" ? node.styles.paddingLeft : 0;
  const gap = typeof node.styles?.gap === "number" ? node.styles.gap : 0;

  const hasExplicitWidth = !!node.styles?.width || !!anyNode.position?.width;
  const hasExplicitHeight = !!node.styles?.height || !!anyNode.position?.height;

  const autoLayout: AutoLayoutProperties = {
    layoutMode,
    primaryAxisSizingMode: node.autoLayout?.primaryAxisSizingMode ?? (hasExplicitWidth ? "FIXED" : "AUTO"),
    counterAxisSizingMode: node.autoLayout?.counterAxisSizingMode ?? (hasExplicitHeight ? "FIXED" : "AUTO"),
    primaryAxisAlignItems:
      node.styles?.justifyContent === "space-between"
        ? "SPACE_BETWEEN"
        : node.styles?.justifyContent === "center"
        ? "CENTER"
        : node.styles?.justifyContent === "flex-end"
        ? "MAX"
        : "MIN",
    counterAxisAlignItems:
      node.styles?.alignItems === "center"
        ? "CENTER"
        : node.styles?.alignItems === "flex-end"
        ? "MAX"
        : "MIN",
    padding: node.autoLayout?.padding ?? {
      top: padTop,
      right: padRight,
      bottom: padBottom,
      left: padLeft,
    },
    itemSpacing: node.autoLayout?.itemSpacing ?? gap,
    layoutGrow: node.styles?.width === "100%" ? 1 : 0,
    layoutAlign: node.styles?.alignItems === "stretch" ? "STRETCH" : "INHERIT",
  };

  return {
    ...node,
    autoLayout: node.autoLayout ?? autoLayout,
    children: (node.children || []).map(normalizeToAutoLayout),
  };
}

export const ScreenContentSchema = z.object({
  screenId: z.string(),
  title: z.string(),
  route: z.string(),
  purpose: z.string().optional(),
  viewports: z.array(z.enum(["desktop", "tablet", "mobile"])).default(["desktop"]),
  rootNode: LayoutNodeSchema,
  associatedFeatureId: z.string().optional(),
});
export type ScreenContent = z.infer<typeof ScreenContentSchema>;

