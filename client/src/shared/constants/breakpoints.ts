import {
  BREAKPOINTS as SHARED_BREAKPOINTS,
  CONTENT_MAX_WIDTH as SHARED_CONTENT_MAX_WIDTH,
} from './responsiveTokens';

type Breakpoints = {
  dinosaur: number;
  xxsm: number;
  xsm: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

type ContentMaxWidth = {
  mobile: number;
  dinosaur: number;
  xxsm: number;
  xsm: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

export const BREAKPOINTS: Breakpoints = SHARED_BREAKPOINTS;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// Used to cap regular section content while section shells remain full width.
export const CONTENT_MAX_WIDTH: ContentMaxWidth = SHARED_CONTENT_MAX_WIDTH;
