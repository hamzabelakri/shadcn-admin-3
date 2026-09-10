# Theming, fonts, and direction

> **Status:** draft. Ties together [Context providers](./context-providers.md) and the CSS in `src/styles/`.

Three independent systems — color theme, font, and text direction — each follow the same loop: **a context provider writes a value to the DOM (class or attribute) → CSS in `theme.css` / `index.css` reads it.** None of this is React-driven at the CSS level; the providers exist to manage *state and persistence*, while plain CSS does the actual styling.

## Color theme (light / dark)

- `ThemeProvider` resolves `theme` (`light` / `dark` / `system`) to a concrete `resolvedTheme`, adding a `.light` or `.dark` class to `<html>`.
- `theme.css` defines the full design-token set twice — once under `:root` (light) and once under `.dark` — using the `oklch()` color space. Switching the class swaps every token in one pass; no component needs to know which theme is active.
- Tailwind v4 is configured **CSS-first**: there's no `tailwind.config.js`. Tokens are mapped to Tailwind's color system inside an `@theme inline { ... }` block (e.g. `--color-primary: var(--primary)`), which is what makes `bg-primary`, `text-foreground`, etc. resolve correctly.
- The sidebar has its **own token namespace** (`--sidebar`, `--sidebar-foreground`, ...), currently just aliased to the main tokens — but this means the sidebar's palette *can* diverge from the rest of the app later without touching every sidebar component.

## Fonts

Three files work together, and adding a font requires touching all three (this is documented inline in `config/fonts.ts` — reproduced here as the canonical steps):

1. **`config/fonts.ts`** — add the font name to the `fonts` array. This is the single source of truth for which fonts exist.
2. **`index.html`** — add the actual `<link>` tag to load the font (e.g. from Google Fonts).
3. **`styles/theme.css`** — add a matching CSS variable inside `@theme inline`, e.g. `--font-roboto: 'Roboto', var(--font-sans);`.

At runtime, `FontProvider` takes the persisted font name and adds a `font-{name}` class to `<html>` (after removing any previous `font-*` class) — that class name is what Tailwind resolves against the `--font-{name}` variable from step 3. If you add a font to `fonts.ts` but skip steps 2–3, the class will be applied but silently fall back to the default typeface.

## Direction (LTR / RTL)

- `DirectionProvider` sets `dir="ltr"` or `dir="rtl"` on `<html>`, and separately wraps children in Radix UI's own `DirectionProvider` — meaning Radix primitives (dialogs, dropdowns, popovers) get correct RTL behavior automatically, not just raw text direction.
- CSS in `index.css` uses **logical properties** rather than physical left/right where it matters for RTL — e.g. `.faded-bottom` uses `after:start-0` instead of `after:left-0`. Any new custom utility that involves horizontal positioning should follow this same logical-property convention to stay RTL-safe.

## Practical takeaway for new features

If you're building a new component: reach for the existing Tailwind utility classes (`bg-primary`, `text-muted-foreground`, etc.) rather than hardcoding colors — they already resolve correctly across light/dark and (for spacing) LTR/RTL. You should only need to touch `theme.css` directly when introducing a genuinely new design token, not when building a typical page.
