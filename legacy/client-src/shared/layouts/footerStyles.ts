export const footerStyles = {
  section: 'section-style relative border-t-2 border-white/20 bg-gradient-to-b from-black/50 via-black/80 to-black',
  content: 'section-content',
  wrapper: 'responsiveness',
  card: 'relative overflow-hidden py-8 sm:py-10',
  groundTexture:
    'absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_50%)] pointer-events-none',
  groundLines:
    'absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent',
  grid:
    'absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]',
  layout: 'relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between',
  brand: 'flex flex-col gap-2',
  name: 'font-bruno text-white text-[18px] tracking-[2px] drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]',
  role: 'font-jura text-white/80 text-[13px] tracking-[0.4px]',
  tagline: 'font-jura text-white/60 text-[12px] max-w-[320px] leading-relaxed',
  columns: 'flex flex-col gap-6 sm:flex-row sm:gap-10',
  columnTitle: 'font-bruno text-white/90 text-[13px] tracking-[1px] mb-1',
  linkList: 'mt-3 flex flex-col gap-2 text-[12px] font-jura text-white/70',
  link: 'hover:text-white transition-colors duration-200',
  socialList: 'mt-3 flex items-center gap-3',
  socialLink:
    'flex items-center gap-2 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] font-jura text-white/70 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all duration-200',
  socialIcon: 'h-3.5 w-3.5',
  divider: 'my-6 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent',
  bottomRow:
    'flex flex-col gap-2 text-[11px] font-jura text-white/50 sm:flex-row sm:items-center sm:justify-between',
};
