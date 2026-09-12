export const CARD_THEMES = [
  { id: "linen", name: "Linen", background: "#f1ece2", foreground: "#34352e" },
  { id: "sage", name: "Sage", background: "#dce5d9", foreground: "#283c30" },
  { id: "rose", name: "Rose", background: "#ecd9d4", foreground: "#543731" },
  { id: "sky", name: "Sky", background: "#dce5ed", foreground: "#293d51" },
  {
    id: "lavender",
    name: "Lavender",
    background: "#e3dff0",
    foreground: "#443959",
  },
  { id: "night", name: "Night", background: "#303c3b", foreground: "#ffffff" },
  {
    id: "woodland",
    name: "Woodland",
    background: "#354532",
    foreground: "#ffffff",
    image: "/backgrounds/woodland.png",
  },
] as const;
export type CardTheme = (typeof CARD_THEMES)[number]["id"] | "photo";
export function cardAppearance(theme: string = "linen", image?: string | null) {
  if (theme === "photo" && image)
    return { background: "#29302a", foreground: "#ffffff", image };
  const choice = CARD_THEMES.find((t) => t.id === theme) || CARD_THEMES[0];
  return {
    background: choice.background,
    foreground: choice.foreground,
    image: "image" in choice ? choice.image : null,
  };
}
export function validCardTheme(value: unknown): value is CardTheme {
  return value === "photo" || CARD_THEMES.some((theme) => theme.id === value);
}
