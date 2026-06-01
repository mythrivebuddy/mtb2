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

  borderLight: "border-[var(--border-light)]",
  borderAccent: "border-[var(--border-accent)]",

  buttonDark:
    "bg-[var(--button-dark)] text-white hover:bg-[var(--button-dark-hover)]",
  typography: {
    brandNavbarHeading: `${cormorant.className} text-2xl x1260:text-3xl font-medium `,
    brandFooterHeading:`${cormorant.className} text-2xl x1260:text-3xl  font-medium `,
    brandDashboardFooterHeading: `${cormorant.className} text-lg x1260:text-xl font-medium `,
   h1: `${cormorant.className}  leading-[1.2] font-medium`,
  },
};
