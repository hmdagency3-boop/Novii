// Mirrors novii/client/src/index.css CSS variables (HSL → hex).
// Light: --primary 262 80% 50% → #6419e6
// Dark : --primary 262 80% 60% → #8347eb
const colors = {
  light: {
    text: "#0a0a0f",
    tint: "#6419e6",

    background: "#ffffff",
    foreground: "#0a0a0f",

    card: "#ffffff",
    cardForeground: "#0a0a0f",

    primary: "#6419e6",
    primaryForeground: "#fafafa",

    secondary: "#f4f4f5",
    secondaryForeground: "#18181b",

    muted: "#f3f3f5",
    mutedForeground: "#71717a",

    accent: "#f3e8ff",
    accentForeground: "#6419e6",

    destructive: "#ef4444",
    destructiveForeground: "#fafafa",

    border: "#e4e4e7",
    input: "#e4e4e7",
    ring: "#6419e6",
  },

  dark: {
    text: "#fafafa",
    tint: "#8347eb",

    background: "#09090b",
    foreground: "#fafafa",

    card: "#0e0e10",
    cardForeground: "#fafafa",

    primary: "#8347eb",
    primaryForeground: "#0a0a0f",

    secondary: "#27272a",
    secondaryForeground: "#fafafa",

    muted: "#27272a",
    mutedForeground: "#a1a1aa",

    accent: "#27272a",
    accentForeground: "#fafafa",

    destructive: "#7f1d1d",
    destructiveForeground: "#fafafa",

    border: "#27272a",
    input: "#27272a",
    ring: "#8347eb",
  },

  radius: 12,
};

export default colors;
