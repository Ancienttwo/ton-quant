# Design System — TonQuant

## Product Context
- **What this is:** TON DeFi quantitative research CLI for AI Agents
- **Who it's for:** AI Agents (OpenClaw via Telegram), developers, quant traders
- **Space/industry:** Crypto / DeFi / Quantitative Trading
- **Project type:** CLI tool (primary) + Web research management dashboard (future)
- **Interaction model:** Telegram Agent conversation → CLI `--json` → structured data

## Aesthetic Direction
- **Direction:** Retro-Futuristic Terminal
- **Decoration level:** Intentional — subtle terminal texture, monospace grid alignment, data card glow borders
- **Mood:** Bloomberg Terminal meets cyberpunk. Serious, precise, data-first. Not another purple-gradient DeFi dashboard.
- **Reference sites:** Dune Analytics, DeFi Llama, TradingView, cointop (terminal), OpenClaw

## Typography
- **Display/Hero:** Satoshi (700, 900) — geometric with personality, avoids overused Inter/Poppins
- **Body:** Geist (400, 500, 600) — Vercel-made, developer-optimized, crisp
- **UI/Labels:** Geist or JetBrains Mono uppercase (11px, letter-spacing 1-2px)
- **Data/Tables:** JetBrains Mono (tabular-nums) — gold standard for aligned numbers
- **Code:** JetBrains Mono
- **Loading:**
  - Satoshi: `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`
  - Geist + JetBrains Mono: Google Fonts
- **Scale:** 11px (label) / 13px (body-sm) / 14px (body) / 16px (body-lg) / 20px (h3) / 28px (h2) / 42px (h1)

## Color
- **Approach:** Restrained — Electric Cyan + Deep Space
- **Primary:** `#00E5FF` — main accent, active states, key data highlights
- **Secondary:** `#FFB800` — warnings, secondary accent, hover states
- **Success:** `#00E676` — positive change, profit, success states
- **Error:** `#FF5252` — negative change, loss, error states
- **Info:** `#40C4FF` — informational, links
- **Surfaces:**
  - Dark: `#0A0E14` (main background)
  - Elevated: `#111820` (cards, panels)
  - Hover: `#1A2230` (interactive hover)
- **Neutrals:**
  - 100: `#E8ECEF` (primary text)
  - 80: `#B8C0CC` (secondary text)
  - 60: `#8B95A5` (tertiary text, labels)
  - 30: `#3D4A5C` (borders, dividers)
  - 15: `#1E2736` (subtle separators)
- **Dark mode:** Primary theme. All colors above are dark-mode native.
- **Light mode:** Invert surfaces (`#F4F6F8` base, `#FFFFFF` elevated), darken text (`#0A0E14`), reduce accent saturation 10-20%

### CLI Color Mapping
| Design Token | chalk Function |
|-------------|---------------|
| Primary | `chalk.cyan` |
| Secondary | `chalk.yellow` |
| Success | `chalk.green` |
| Error | `chalk.red` |
| Info | `chalk.blueBright` |
| Neutral-60 | `chalk.dim` / `chalk.gray` |
| Bold text | `chalk.bold` |

## Spacing
- **Base unit:** 4px
- **Density:** Compact — data-dense product optimized for efficiency
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(12px) lg(16px) xl(24px) 2xl(32px) 3xl(48px)

## Layout
- **Approach:** Grid-disciplined / Industrial
- **Grid:** 12 columns (desktop), 6 (tablet), 4 (mobile)
- **Max content width:** 1200px
- **Border radius:** sm: 4px, md: 8px, lg: 12px, full: 9999px

## Motion
- **Approach:** Minimal-functional
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms)
- **Rules:** Data number changes can use counter animation. Page transitions use fade. No bouncing, no decorative animation.

## Component Patterns
- **Cards:** `surface-elevated` background, `neutral-30` border, `radius-md`. Glow variant adds `primary` border + `box-shadow: 0 0 20px primary-dim`
- **Tables:** `font-mono`, `tabular-nums`, `neutral-30` header border, `neutral-15` row borders, hover row highlight
- **Buttons:** Primary (cyan bg, dark text), Secondary (transparent, border), Ghost (transparent, cyan text)
- **Inputs:** `surface` background, `neutral-30` border, `primary` focus border
- **Alerts:** Left-border accent (3px), tinted background (color at 6% opacity)
- **Labels:** `font-mono`, 10-11px, uppercase, letter-spacing 1-2px, `neutral-60` color

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-22 | Initial design system created | Based on crypto/DeFi competitive research. Chose Electric Cyan over purple to differentiate from generic DeFi aesthetic. Terminal-first approach matches CLI product nature. |
| 2026-03-22 | Satoshi over Inter/Poppins | Geometric personality without being overused. Avoids the "every SaaS looks the same" trap. |
| 2026-03-22 | Compact spacing | Quant traders and developers prefer data density over whitespace comfort. |
