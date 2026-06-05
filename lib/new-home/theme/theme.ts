// /lib/new-home/theme/theme.ts
import { cormorant } from "../fonts/fonts";

export const theme = {
  bgPrimary: "bg-[var(--bg-primary)]",
  bgSecondary: "bg-[var(--bg-secondary)]",
  bgTertiary: "bg-[var(--bg-tertiary)]",
  highLightBgColor: "bg-[var(--highlight-bg)]",
  highLightTextColor: "text-[var(--highlight-text)]",
  hightLightBorderColor: "border-[var(--highlight-border)]",

  textDark: "text-[var(--text-dark)]",
  textAccent: "text-[var(--text-accent)]",
  hoverTextAccent: "hover:text-[var(--text-accent)]",
  borderLight: "border-[var(--border-light)]",
  borderAccent: "border-[var(--border-accent)]",
  bgDark: "bg-[var(--button-dark)]",
  buttonDark:
    "bg-[var(--button-dark)] text-white hover:bg-[var(--button-dark-hover)]",
    buttonLight: "bg-[var(--button-dark-hover)] hover:bg-[var(--button-dark)]",
  typography: {
    brandNavbarHeading: `${cormorant.className} text-2xl x1260:text-3xl font-medium `,
    brandFooterHeading: `${cormorant.className} text-2xl x1260:text-3xl  font-medium `,
    brandDashboardFooterHeading: `${cormorant.className} text-lg x1260:text-xl font-medium `,
    h1: `${cormorant.className}  leading-[1.2] font-medium`,
  },

  // new for events step 1 step 2 majorly 
  eventTitleInput:
    "w-full bg-transparent border-0 border-b border-[var(--border-light)] focus:border-[var(--border-accent)] focus:ring-0 outline-none transition-all",

  chip: "px-6 py-2 rounded-full border text-sm font-medium transition-all",

  chipActive: "border-[var(--border-accent)] text-[var(--text-accent)]",

  chipInactive:
    "border-[var(--border-light)] hover:border-[var(--border-accent)]",

  editorContainer:
    "border border-[var(--colors-secondary)] rounded-lg overflow-hidden focus-within:ring-1 focus-within:border-[var(--highlight-border)] transition-all",

  editorToolbar:
    "p-3 flex gap-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]",

  dropzoneBase:
    "group relative w-full h-64 border-2 border-dashed border-[var(--border-accent)] rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden",

  dropzoneIdle: "border-[var(--border-accent)] bg-[var(--bg-tertiary)]",

  dropzoneActive: "border-[var(--border-accent)] bg-[var(--highlight-bg)]",

  footer:
    "bg-white border-t rounded-lg border-[var(--border-light)] shadow-[0_-4px_10px_rgba(0,0,0,0.03)]",
  /* ========= STEPPER ========= */

  stepperCircleBase:
    "w-10 h-10 rounded-full flex items-center justify-center font-bold",

  stepperCircleActive: "bg-[var(--button-dark)] text-white shadow-lg",

  stepperCircleInactive:
    "border-2 border-[var(--border-light)] bg-white opacity-60",

  stepperLabelActive: "text-sm font-semibold",

  stepperLabelInactive: "text-sm opacity-50",

  stepperLine:
    "flex-1 h-[2px] mx-4 -mt-8 border-t-2 border-[var(--border-light)] opacity-40",
  inputBase:
    "w-full bg-transparent border border-[var(--border-light)] rounded-lg px-4 py-3 outline-none focus:border-[var(--border-accent)] transition-all",

  select:
    "w-full bg-transparent border border-[var(--border-light)] rounded-lg px-4 py-3 outline-none focus:border-[var(--border-accent)]",

  inputGroup: "grid grid-cols-1 md:grid-cols-3 gap-6",
};
