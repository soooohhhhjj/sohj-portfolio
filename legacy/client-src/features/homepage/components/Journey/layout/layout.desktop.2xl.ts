import type { LayoutConfig } from "./layout.types";
import { layoutDesktopXl } from "./layout.desktop.xl";

const canvasWidth = 1280;
const offsetX = (canvasWidth - layoutDesktopXl.canvasWidth) / 2;

export const layoutDesktop2xl: LayoutConfig = {
  ...layoutDesktopXl,
  id: "desktop-2xl",
  minWidth: 1536,
  maxWidth: undefined,
  canvasWidth,
  items: layoutDesktopXl.items.map((item) => ({ ...item, x: item.x + offsetX })),
  edges: layoutDesktopXl.edges.map((edge) => ({
    ...edge,
    via: edge.via
      ? edge.via.map((point) => ({ ...point, x: point.x + offsetX }))
      : undefined,
  })),
};
