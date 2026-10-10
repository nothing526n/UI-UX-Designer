import { z } from "zod";

export const TriggerTypeEnum = z.enum([
  "onClick",
  "onHover",
  "onTimer",
  "onDrag",
  "onFocus",
]);
export type TriggerType = z.infer<typeof TriggerTypeEnum>;

export const ActionTypeEnum = z.enum([
  "navigate",
  "openOverlay",
  "closeOverlay",
  "goBack",
  "toggleState",
]);
export type ActionType = z.infer<typeof ActionTypeEnum>;

export const TransitionTypeEnum = z.enum([
  "instant",
  "dissolve",
  "slide_left",
  "slide_right",
  "slide_up",
  "slide_down",
]);
export type TransitionType = z.infer<typeof TransitionTypeEnum>;

export const OverlaySettingsSchema = z.object({
  position: z.enum(["center", "top", "bottom", "right"]).default("center"),
  hasBackdrop: z.boolean().default(true),
  closeOnOutsideClick: z.boolean().default(true),
});
export type OverlaySettings = z.infer<typeof OverlaySettingsSchema>;

export const PrototypeInteractionSchema = z.object({
  id: z.string(),
  sourceScreenId: z.string(),
  sourceNodeId: z.string(), // Hotspot element ID
  trigger: TriggerTypeEnum.default("onClick"),
  action: ActionTypeEnum.default("navigate"),
  targetScreenId: z.string().optional(),
  targetOverlayId: z.string().optional(),
  transition: TransitionTypeEnum.default("instant"),
  transitionDurationMs: z.number().default(200),
  overlaySettings: OverlaySettingsSchema.optional(),
});
export type PrototypeInteraction = z.infer<typeof PrototypeInteractionSchema>;

export const PrototypeContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  initialScreenId: z.string(),
  deviceFrame: z.enum(["macbook", "ipad", "iphone", "android", "none"]).default("macbook"),
  screenIds: z.array(z.string()),
  interactions: z.array(PrototypeInteractionSchema),
});
export type PrototypeContent = z.infer<typeof PrototypeContentSchema>;
