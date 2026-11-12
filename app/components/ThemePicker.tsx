"use client";

import { useState, useTransition } from "react";
import { setTheme } from "@/app/actions";
import type { AccentTheme } from "@prisma/client";

const THEMES: { value: AccentTheme; label: string; swatch: string }[] = [
  { value: "TAN", label: "Tan", swatch: "#a8794a" },
  { value: "RED", label: "Red", swatch: "#d1453c" },
  { value: "ORANGE", label: "Orange", swatch: "#dd7f2c" },
  { value: "YELLOW", label: "Yellow", swatch: "#b08f0b" },
  { value: "BLUE", label: "Blue", swatch: "#2a78d6" },
  { value: "TEAL", label: "Teal", swatch: "#1f9c8f" },
  { value: "GREEN", label: "Green", swatch: "#3a9950" },
  { value: "PURPLE", label: "Purple", swatch: "#8456c9" },
  { value: "PINK", label: "Pink", swatch: "#d6568f" },
  { value: "GRAYSCALE", label: "Grayscale", swatch: "#65645f" },
  { value: "BLACK", label: "Black", swatch: "#141414" },
];

export function ThemePicker({ current }: { current: AccentTheme }) {
  const [value, setValue] = useState<AccentTheme>(current);
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: AccentTheme) => {
    setValue(next);
    // Instant feedback: flip the attribute client-side before the server action resolves.
    document.documentElement.dataset.accent = next.toLowerCase();
    startTransition(async () => {
      await setTheme(next);
    });
  };

  const activeSwatch = THEMES.find((t) => t.value === value)?.swatch ?? "#a8794a";

  return (
    <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
      <span
        className="inline-block w-3 h-3 rounded-full shrink-0"
        style={{ background: activeSwatch, opacity: isPending ? 0.5 : 1 }}
        aria-hidden
      />
      <span className="sr-only">Theme color</span>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value as AccentTheme)}
        className="rounded px-2 py-1 text-sm"
        style={{
          border: "1px solid var(--border-hairline)",
          background: "var(--surface-1)",
          color: "var(--text-primary)",
        }}
      >
        {THEMES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}
