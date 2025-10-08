export function getThemeClasses(theme: "light" | "dark") {
  return {
    surface: theme === "dark"
      ? "bg-[color:var(--surface)] border-[color:var(--surface-border-strong)] text-[color:var(--foreground)]"
      : "bg-white border-[color:var(--surface-border-strong)] text-[color:var(--foreground)]",
    muted: "bg-[color:var(--surface-muted)] text-[color:var(--foreground)]",
    border: "border-[color:var(--surface-border)]",
    buttonPrimary: "w-full rounded-md py-2.5 font-medium text-white bg-[#7a0d0d] hover:brightness-110",
    buttonSecondary: theme === "dark"
      ? "rounded-md px-3 py-2 border border-[color:var(--surface-border)] bg-[color:var(--surface-alt)] text-[color:var(--foreground)] hover:bg-[color:var(--surface)]"
      : "rounded-md px-3 py-2 border bg-white text-[color:var(--foreground)] hover:bg-[color:var(--surface-muted)]",
    textMuted: theme === "dark" ? "text-gray-300" : "text-gray-600",
    radioAccent: theme === "dark" ? "#dfa32e" : "#7a0d0d",
  };
}