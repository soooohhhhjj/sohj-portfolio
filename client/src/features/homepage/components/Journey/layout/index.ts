import type { LayoutConfig } from "./layout.types";
import { layoutDesktopLg } from "./layout.desktop.lg";
import { layoutDesktopXl } from "./layout.desktop.xl";
import { layoutDesktop2xl } from "./layout.desktop.2xl";
import { layoutMobile } from "./layout.mobile";
import { layoutMobileXxsm } from "./layout.mobile.xxsm";
import { layoutMobileSm } from "./layout.mobile.sm";
import { layoutTablet } from "./layout.tablet";

export const journeyLayouts: LayoutConfig[] = [
  layoutMobileXxsm,
  layoutMobile,
  layoutMobileSm,
  layoutTablet,
  layoutDesktopLg,
  layoutDesktopXl,
  layoutDesktop2xl,
];

export const pickLayout = (width: number | null) => {
  if (!width) return layoutDesktopLg;

  return (
    journeyLayouts.find(
      (layout) =>
        width >= layout.minWidth &&
        (layout.maxWidth === undefined || width <= layout.maxWidth)
    ) ?? layoutDesktopLg
  );
};
