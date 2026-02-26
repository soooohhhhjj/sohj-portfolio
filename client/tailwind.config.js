import { BREAKPOINTS, CONTENT_MAX_WIDTH } from './src/shared/constants/responsiveTokens.js';

const screens = Object.fromEntries(
  Object.entries(BREAKPOINTS).map(([key, value]) => [key, `${value}px`]),
);

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens,
    extend: {
      maxWidth: {
        'content-mobile': `${CONTENT_MAX_WIDTH.mobile}px`,
        'content-dinosaur': `${CONTENT_MAX_WIDTH.dinosaur}px`,
        'content-xxsm': `${CONTENT_MAX_WIDTH.xxsm}px`,
        'content-xsm': `${CONTENT_MAX_WIDTH.xsm}px`,
        'content-sm': `${CONTENT_MAX_WIDTH.sm}px`,
        'content-md': `${CONTENT_MAX_WIDTH.md}px`,
        'content-lg': `${CONTENT_MAX_WIDTH.lg}px`,
        'content-xl': `${CONTENT_MAX_WIDTH.xl}px`,
      },
      fontFamily: {
        maven: ['Maven Pro', 'sans-serif'],
        jura: ['Jura', 'sans-serif'],
        oxanium: ['Oxanium', 'sans-serif'],
        anta: ['Anta', 'sans-serif'],
        audiowide: ['Audiowide', 'sans-serif'],
        bruno: ['Bruno Ace SC', 'sans-serif'],
        sansation: ['Sansation', 'sans-serif'],
        zalando: ['Zalando Sans Expanded', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
