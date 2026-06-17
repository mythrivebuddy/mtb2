// /lib/new-home/theme/theme.ts
import { cormorant } from "../fonts/fonts";

export const theme = {
  /* ================= BACKGROUNDS ================= */
  // Surface colors aligned with brand emotion (calm, warm, structured)
  bg: {
    warm: "bg-[var(--surface-warm)]",
    base: "bg-[var(--surface-base)]",
    calm: "bg-[var(--surface-calm)]",
    card: "bg-[var(--surface-card)]",
    soft: "bg-[var(--surface-soft)]",
    softHover: "hover:bg-[var(--surface-soft)]",
    warmAccent: "bg-[var(--brand-warm)]",
    // uses [background:] because Tailwind bg- only supports background-color
    cta: "[background:var(--surface-cta)]",
    accent: "bg-[var(--ink-accent)]",
  },

  /* ================= TEXT ================= */
  // Text hierarchy (primary -> secondary -> accent)
  text: {
    primary: "text-[var(--ink-primary)]",
    secondary: "text-[var(--ink-secondary)]",
    accent: "text-[var(--ink-accent)]",
    muted: "text-[var(--ink-muted)]",
    soft: "text-[var(--ink-soft)]",
  },

  /* ================= BORDERS ================= */
  border: {
    light: "border-[var(--border-light)]",
    accent: "border-[var(--border-accent)]",
    soft: "border-[var(--border-soft)]",
  },

  /* ================= BUTTONS ================= */
  // Primary CTA actions
  button: {
    primary:
      "bg-[var(--brand-deep)] text-[var(--ink-inverse)] hover:bg-[var(--brand-deep-hover)]",
  },

  /* ================= TYPOGRAPHY ================= */
  typography: {
    brandNavbarHeading: `${cormorant.className} text-2xl x1260:text-3xl font-medium `,
    brandFooterHeading: `${cormorant.className} text-2xl x1260:text-3xl  font-medium `,
    brandDashboardFooterHeading: `${cormorant.className} text-lg x1260:text-xl font-medium `,
    h1: `${cormorant.className} leading-[1.2] font-medium`,
  },

  /* ================= CARD PATTERNS ================= */
  // Reusable UI patterns used across sections
  card: {
    base: "bg-[var(--surface-base)] border border-[var(--border-accent)] rounded-[2rem]",
    feature:
      "bg-[var(--surface-base)] border border-[var(--border-accent)] rounded-[2rem] p-8 flex items-start gap-6",
    problem:
      "bg-[var(--surface-base)] border border-[var(--border-accent)] rounded-2xl flex flex-col items-center text-center",
  },

  /* ================= ICON WRAPPERS ================= */
  // Circular icon containers
  icon: {
    wrapper:
      "w-14 h-14 rounded-full flex items-center justify-center border border-[var(--border-light)] bg-[var(--surface-calm)] text-[var(--ink-accent)]",
    streak: "text-[var(--brand-streak)]",
  },

  /* ================= LAYOUT ================= */
  // ONLY repeated responsive patterns (used 3+ times)
  layout: {
    container: "px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto",
    sectionY: "py-14 sm:py-24",
    grid3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  },

  // DEPRECATED — use theme.bg.*, theme.text.*, etc
  bgPrimary: "bg-[var(--surface-warm)]",
  bgSecondary: "bg-[var(--surface-base)]",
  bgTertiary: "bg-[var(--surface-calm)]",
  highLightBgColor: "bg-[var(--ink-accent)]",
  highLightTextColor: "text-[var(--ink-accent)]",
  hightLightBorderColor: "border-[var(--border-accent)]",

  textDark: "text-[var(--ink-primary)]",
  textAccent: "text-[var(--ink-accent)]",
  hoverTextAccent: "hover:text-[var(--ink-accent)]",
  borderLight: "border-[var(--border-light)]",
  borderAccent: "border-[var(--border-accent)]",
  bgDark: "bg-[var(--brand-deep)]",
  buttonDark:
    "bg-[var(--brand-deep)] text-[var(--ink-inverse)] hover:bg-[var(--brand-deep-hover)]",
  buttonLight: "bg-[var(--brand-deep-hover)] hover:bg-[var(--brand-deep)]",

  // new for events step 1 step 2 majorly
  eventTitleInput:
    "w-full bg-[transparent] border-0 border-b border-[var(--brand-momentum)] focus:ring-0 outline-none transition-all",

  chip: "text-base px-6 py-2 rounded-full border text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-accent)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",

  chipActive: "bg-[var(--brand-deep)] text-[var(--ink-inverse)]",

  chipInactive: "hover:text-[var(--brand-deep)]",

  editorContainer:
    "border border-[var(--brand-momentum)] rounded-lg overflow-hidden focus-within:ring-1 transition-all",

  editorToolbar:
    "p-3 flex gap-4 border-b border-[var(--border-light)] bg-[var(--surface-base)]",

  dropzoneBase:
    "group relative w-full h-64 border-2 border-dashed border-[var(--brand-momentum)] rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden",

  dropzoneIdle: "border-[var(--brand-momentum)] bg-[var(--surface-calm)]",

  dropzoneActive: "border-[var(--brand-momentum)] bg-[var(--ink-accent)]",

  footer:
    "bg-[var(--surface-base)]  border-t rounded-lg border-[var(--border-accent)] shadow-[0_-4px_10px_rgba(0,0,0,0.03)]",
  /* ========= STEPPER ========= */

  stepperCircleBase:
    "w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-[14px] rounded-full flex items-center justify-center font-bold",

  stepperCircleActive:
    "bg-[var(--brand-deep)] text-[var(--ink-inverse)] shadow-lg",

  stepperCircleInactive:
    "border-2 border-[var(--border-light)] bg-[var(--surface-base)] opacity-60",

  stepperLabelActive: "text-[var(--brand-deep)] text-xs sm:text-sm",

  stepperLabelInactive:
    "text-[var(--brand-deep)] text-xs sm:text-sm opacity-50",

  stepperLine: "flex-1  mx-4 -mt-8 border-t border-[var(--border-stepper)]",
  inputBase:
    "w-full bg-[transparent] border border-[var(--border-light)] rounded-lg px-4 py-3 outline-none focus:border-[var(--border-accent)] transition-all",

  select:
    "w-full bg-[transparent] border border-[var(--border-light)] rounded-lg px-4 py-3 outline-none focus:border-[var(--border-accent)]",

  inputGroup: "grid grid-cols-1 md:grid-cols-3 gap-6",
};


// used in event creation stepper chip button TimeSelect of step 3 component 