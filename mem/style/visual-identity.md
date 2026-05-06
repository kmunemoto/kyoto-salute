---
name: Visual Identity
description: Apple Music–style glassmorphism. Tiffany-blue gradient bg, frosted white cards/nav/inputs, pill buttons.
type: design
---
**Background (fixed):** linear-gradient(180deg, #E0F7F6 0%, #C8EBF0 50%, #F0F4FF 100%), background-attachment: fixed.

**Cards / surfaces:** rgba(255,255,255,0.6), backdrop-filter blur(20px) (+ -webkit-), border 1px rgba(255,255,255,0.3), radius 16px, shadow 0 4px 30px rgba(0,0,0,0.05). Applied globally via `.bg-card` override in index.css.

**Primary buttons:** rgba(10,186,181,0.85) + blur(10px), pill (radius 25px), white text 600, shadow 0 4px 15px rgba(10,186,181,0.3). Applied via `.bg-primary`.

**Secondary/outline buttons:** rgba(255,255,255,0.5) + blur(10px), border rgba(255,255,255,0.5), pill, color #333.

**Inputs:** rgba(255,255,255,0.5) + blur(10px), border rgba(255,255,255,0.5), radius 12px, focus border #0ABAB5.

**Bottom nav (nav.glass):** rgba(255,255,255,0.7) + blur(30px), border-top rgba(255,255,255,0.3). Active #0ABAB5, inactive #999.

**Typography:** -apple-system / SF Pro Text / Inter. Headings #1A1A1A weight 700; body #333 weight 400; sub #999.

**How to apply:** All overrides live in index.css — components keep using shadcn defaults (bg-card, bg-primary, etc.). Avoid hardcoded dark backgrounds; use glass surfaces instead.
