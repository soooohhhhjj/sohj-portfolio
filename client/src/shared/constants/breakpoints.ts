export const BREAKPOINTS = {
  dinosaur: 350, // ~350px legacy / very old super fossil devices
  xxsm: 400,     // 400px+ compact modern small phones
  xsm: 480,      // 480px+ larger phones
  sm: 640,   // 640px+ still mobile but on modern ones / big Android phones
  md: 768,   // 768px+ tablets / iPads on portrait
  lg: 1024,  // 1024px+ small laptops / tablets-iPads on landscape
  xl: 1280,  // 1280px+ 13"-15" laptops / most office monitors / typical dev machines
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// Used to cap regular section content while section shells remain full width.
export const CONTENT_MAX_WIDTH = {
  mobile: 300,
  dinosaur: 310,
  xxsm: 360,
  xsm: 440,
  sm: 576,
  md: 730,
  lg: 930,
  xl: 930,
  // '2xl': 1280, // Optional ultra-wide cap when needed later.
} as const;
