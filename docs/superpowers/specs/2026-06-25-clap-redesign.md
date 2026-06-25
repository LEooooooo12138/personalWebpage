# Clap Redesign — Medium-Style

**Date**: 2026-06-25
**Status**: implementing

## Problem
- CSS class mismatch: component uses `clap-btn`, CSS defines `.proj-clap-btn` — styles never apply
- No `.proj-toprow` / `.proj-clap-area` desktop layout
- Zero animation feedback on click
- Ugly emoji + naked number doesn't match editorial typography style

## Design

### Visual States
- **Idle**: circle button, gold border, hand SVG icon at 50% opacity, serif count
- **Hover**: solid gold border, icon deepens, subtle ring glow
- **Clap**: icon elastic scale (1→1.4→1), +1 particle floats up & fades, count increments smoothly
- **Hold**: rapid-fire claps every 150ms, particles stack
- **Clapped**: solid gold fill, white icon, "you clapped" tooltip

### Animations
| Phase     | Description          | Duration | Easing                      |
|-----------|----------------------|----------|-----------------------------|
| Press     | icon scale 1→1.4     | 150ms    | ease-out                    |
| Bounce    | icon scale 1.4→1     | 250ms    | cubic-bezier(.34,1.56,.64,1)|
| Particle  | +1 float 20px + fade | 600ms    | ease-out                    |
| Count     | number transition    | 200ms    | ease                        |
| Hold      | repeat every 150ms   | —        | —                           |

### Tech
- Inline SVG hand icon, `currentColor` inherits gold
- CSS `@keyframes` for particle + ring glow
- `useRef` interval for hold-to-clap
- `localStorage` for per-project "clapped" state

### Files
- `src/components/pages/projects-page.tsx` — new clap interaction logic
- `src/app/projects.css` — `.proj-clap-area` desktop styles + keyframes
