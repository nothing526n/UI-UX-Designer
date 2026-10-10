import {
  PrototypeContent,
  ScreenContent,
  UserFlowContent,
} from "@platform/contracts";

export class PrototypeAgent {
  public async generatePrototype(
    screens: ScreenContent[],
    flow?: UserFlowContent
  ): Promise<PrototypeContent> {
    const screenIds = screens.map((s) => s.screenId);
    const initialScreenId = screenIds[0] || "screen_dashboard";

    return {
      id: "proto_main_interactive",
      title: "Interactive Clickable Prototype",
      initialScreenId,
      deviceFrame: "macbook",
      screenIds,
      interactions: [
        {
          id: "int_btn_create",
          sourceScreenId: initialScreenId,
          sourceNodeId: "node_btn_create",
          trigger: "onClick",
          action: "openOverlay",
          targetOverlayId: "overlay_new_record_modal",
          transition: "dissolve",
          transitionDurationMs: 200,
          overlaySettings: {
            position: "center",
            hasBackdrop: true,
            closeOnOutsideClick: true,
          },
        },
        {
          id: "int_row_click",
          sourceScreenId: initialScreenId,
          sourceNodeId: "row_2",
          trigger: "onClick",
          action: "openOverlay",
          targetOverlayId: "overlay_exception_drawer",
          transition: "slide_right",
          transitionDurationMs: 250,
          overlaySettings: {
            position: "right",
            hasBackdrop: true,
            closeOnOutsideClick: true,
          },
        },
        {
          id: "int_filter_attention",
          sourceScreenId: initialScreenId,
          sourceNodeId: "node_tab_attention",
          trigger: "onClick",
          action: "toggleState",
          transition: "instant",
          transitionDurationMs: 0,
        },
      ],
    };
  }
}
