import type { LayoutConfig } from "./layout.types";
import { layoutDesktopXl } from "./layout.desktop.xl";

export const layoutDesktop2xl: LayoutConfig = {
  ...layoutDesktopXl,
  id: "desktop-2xl",
  minWidth: 1536,
  maxWidth: undefined,
  canvasWidth: 1280,
  extraHeight: 200,
  items: layoutDesktopXl.items.map((item) => ({ ...item })),
  edges: layoutDesktopXl.edges.map((edge) => ({
    ...edge,
    via: edge.via ? edge.via.map((point) => ({ ...point })) : undefined,
  })),
};
