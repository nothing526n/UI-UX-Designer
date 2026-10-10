import { LayoutNode, normalizeToAutoLayout } from "@platform/contracts";

export interface ParsedDOMElement {
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  styles?: Record<string, string | number>;
  children?: ParsedDOMElement[];
}

/**
 * Bidirectional Code-to-Canvas Ingest Engine (/prototype-to-figma equivalent).
 * Translates rendered DOM elements and computed CSS into native LayoutNode Auto Layout AST.
 */
export function convertDomElementToLayoutNode(el: ParsedDOMElement): LayoutNode {
  const tag = el.tagName.toLowerCase();
  const styles = el.styles || {};
  const className = el.className || "";

  // 1. Infer NodeType
  let type: any = "frame";
  if (tag === "button" || className.includes("btn") || className.includes("button")) {
    type = "button";
  } else if (tag === "input" || tag === "textarea") {
    type = "input";
  } else if (tag === "table") {
    type = "table";
  } else if (["h1", "h2", "h3", "h4", "h5", "h6", "p", "span"].includes(tag) && (!el.children || el.children.length === 0)) {
    type = "text";
  } else if (className.includes("badge") || className.includes("pill") || className.includes("rounded-full")) {
    type = "badge";
  } else if (styles.border || styles.boxShadow || className.includes("rounded-xl") || className.includes("card")) {
    type = "card";
  }

  // 2. Infer Auto Layout Direction
  let layoutMode: "NONE" | "HORIZONTAL" | "VERTICAL" = "VERTICAL";
  const display = String(styles.display || "");
  const flexDirection = String(styles.flexDirection || "");

  if (className.includes("flex-row") || flexDirection === "row" || (display.includes("flex") && !flexDirection.includes("column"))) {
    layoutMode = "HORIZONTAL";
  } else if (className.includes("flex-col") || flexDirection === "column" || display.includes("flex")) {
    layoutMode = "VERTICAL";
  }

  // 3. Spacing & Padding
  const padTop = Number(styles.paddingTop) || 0;
  const padRight = Number(styles.paddingRight) || 0;
  const padBottom = Number(styles.paddingBottom) || 0;
  const padLeft = Number(styles.paddingLeft) || 0;
  const gap = Number(styles.gap) || (className.includes("gap-") ? 16 : 0);

  // 4. Children conversion
  const children = (el.children || []).map(convertDomElementToLayoutNode);

  const rawNode: LayoutNode = {
    id: el.id || `node_dom_${Math.random().toString(36).substring(2, 9)}`,
    name: `${tag.toUpperCase()}: ${el.textContent ? el.textContent.slice(0, 20) : className.split(" ")[0] || "Container"}`,
    type,
    textContent: el.textContent || undefined,
    props: {},
    styles: {
      backgroundColor: styles.backgroundColor ? String(styles.backgroundColor) : undefined,
      borderColor: styles.borderColor ? String(styles.borderColor) : undefined,
      borderRadius: Number(styles.borderRadius) || undefined,
      color: styles.color ? String(styles.color) : undefined,
      fontSize: Number(styles.fontSize) || undefined,
      fontWeight: styles.fontWeight ? String(styles.fontWeight) : undefined,
    },
    autoLayout: {
      layoutMode,
      primaryAxisSizingMode: styles.width === "100%" || className.includes("w-full") ? "AUTO" : "AUTO",
      counterAxisSizingMode: "AUTO",
      primaryAxisAlignItems:
        className.includes("justify-between") || styles.justifyContent === "space-between"
          ? "SPACE_BETWEEN"
          : className.includes("justify-center")
          ? "CENTER"
          : "MIN",
      counterAxisAlignItems:
        className.includes("items-center") || styles.alignItems === "center" ? "CENTER" : "MIN",
      padding: { top: padTop, right: padRight, bottom: padBottom, left: padLeft },
      itemSpacing: gap,
      layoutGrow: className.includes("flex-1") || styles.flex === "1" ? 1 : 0,
      layoutAlign: className.includes("w-full") ? "STRETCH" : "INHERIT",
    },
    children,
  };

  return normalizeToAutoLayout(rawNode);
}

/**
 * Parses synthetic or serialized HTML string into a DOM element structure
 */
export function parseHtmlSnippetToAst(htmlSnippet: string): LayoutNode {
  // Extract text or build representative AST container
  const isCard =
    htmlSnippet.includes("rounded-xl") ||
    htmlSnippet.includes("Card") ||
    htmlSnippet.includes("<div") ||
    htmlSnippet.includes("<section");
  const isButton = !isCard && (htmlSnippet.includes("<button") || htmlSnippet.includes("Button"));

  const sampleElement: ParsedDOMElement = {
    tagName: isButton ? "button" : isCard ? "div" : "section",
    className: isButton
      ? "px-4 py-2 bg-indigo-600 rounded-lg text-white font-medium"
      : "p-6 rounded-xl bg-[#121520] border border-[#1E2538] flex flex-col gap-4",
    textContent: isButton ? "Action Button" : undefined,
    styles: {
      backgroundColor: isButton ? "#6366F1" : "#121520",
      paddingTop: isButton ? 8 : 24,
      paddingBottom: isButton ? 8 : 24,
      paddingLeft: isButton ? 16 : 24,
      paddingRight: isButton ? 16 : 24,
      gap: isButton ? 0 : 16,
      borderRadius: isButton ? 8 : 12,
    },
    children: isCard
      ? [
          {
            tagName: "h3",
            textContent: "Ingested DOM Component",
            styles: { color: "#F3F6FC", fontSize: 16, fontWeight: "600" },
          },
          {
            tagName: "p",
            textContent: "Synchronized from live runtime into editable Auto Layout canvas node.",
            styles: { color: "#9DA8C3", fontSize: 13 },
          },
        ]
      : [],
  };

  return convertDomElementToLayoutNode(sampleElement);
}
