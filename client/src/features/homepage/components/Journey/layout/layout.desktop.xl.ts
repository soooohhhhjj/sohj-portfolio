import type { LayoutConfig } from "./layout.types";
import { layoutDesktopLg } from "./layout.desktop.lg";

const items = layoutDesktopLg.items.map((item) => ({ ...item }));

export const layoutDesktopXl: LayoutConfig = {
  ...layoutDesktopLg,
  id: "desktop-xl",
  minWidth: 1280,
  maxWidth: 1535,
  canvasWidth: 930,
  extraHeight: 200,
  items,
  edges: layoutDesktopLg.edges.map((edge) => ({
    ...edge,
    via: edge.via ? edge.via.map((point) => ({ ...point })) : undefined,
  })),
};
