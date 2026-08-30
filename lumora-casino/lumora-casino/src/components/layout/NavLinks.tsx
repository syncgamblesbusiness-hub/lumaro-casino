export interface NavItem {
  href: string;
  label: string;
  icon: string; // simple glyph, keeps us fully independent of any icon library/brand
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Lobby", icon: "◆" },
  { href: "/plinko", label: "Plinko", icon: "▽" },
  { href: "/dice", label: "Dice", icon: "⚂" },
  { href: "/ascent", label: "Ascent", icon: "▲" },
  { href: "/fairness", label: "Fairness", icon: "✓" },
];
