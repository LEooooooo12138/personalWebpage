# Admin Panel Redesign — Implementation Plan

**Spec**: `docs/superpowers/specs/2026-06-24-admin-redesign.md`
**Date**: 2026-06-24

---

## File Structure Map

### Files to Delete
- `src/app/admin/(dashboard)/layout.tsx`

### Files to Move (out of (dashboard)/ up to admin/)
- `(dashboard)/page.tsx` → `admin/page.tsx`
- `(dashboard)/experiences/page.tsx` → `admin/experiences/page.tsx`
- `(dashboard)/projects/page.tsx` → `admin/projects/page.tsx`
- `(dashboard)/skills/page.tsx` → `admin/skills/page.tsx`
- `(dashboard)/guestbook/page.tsx` → `admin/guestbook/page.tsx`
- `(dashboard)/visits/page.tsx` → `admin/visits/page.tsx`
- `(dashboard)/profile/page.tsx` → `admin/profile/page.tsx`

### Files to Rewrite
- `src/app/admin/layout.tsx` — CSS Grid `[220px 1fr]`, login detection
- `src/components/admin/AdminSidebar.tsx` — no fixed pos, clean professional
- `src/components/admin/AdminTable.tsx` — blue accent, system fonts
- `src/components/admin/AdminModal.tsx` — blue accent
- `src/components/admin/AdminConfirmDialog.tsx` — consistent colors
- `src/components/admin/PaginationBar.tsx` — blue accent
- `src/app/admin/login/page.tsx` — blue accent, centered card
- `src/app/admin/experiences/page.tsx` — stats cards
- `src/app/admin/projects/page.tsx`
- `src/app/admin/skills/page.tsx`
- `src/app/admin/guestbook/page.tsx`
- `src/app/admin/visits/page.tsx`
- `src/app/admin/profile/page.tsx`

### NOT Changed
- All `src/app/api/admin/*` routes
- All `src/lib/*-db.ts`
- All `src/app/(site)/**`
- `src/app/layout.tsx`
- `.env.local`

---

## Tasks

### 1. Restructure files (move pages, delete old layout)
- Move 7 pages from `admin/(dashboard)/` to `admin/`
- Overwrite `admin/page.tsx` with redirect
- Delete `admin/(dashboard)/layout.tsx` and empty dir
- Verify `npx tsc --noEmit`

### 2. Rewrite admin/layout.tsx
- Client wrapper with `usePathname()` to detect `/admin/login`
- Login: render `<>{children}</>` only
- Dashboard: CSS Grid `grid-cols-[220px_1fr] min-h-screen`
  - Sidebar column: white bg, border-r
  - Content column: `bg-gray-50`, scrollable `<main>`
- Import AdminSidebar

### 3. Rewrite AdminSidebar
- Remove: `fixed`, `z-40`, `backdrop-blur`, all `zinc-*` classes
- Brand: "Admin" (15px/700) + "Portfolio CMS" (10px gray-400 uppercase)
- Nav: emoji icon + label. Active: `bg-blue-50 text-blue-600`. Default: `text-gray-600`
- Bottom: "Back to site" link + "Sign out" button
- Mobile: `lg:hidden` hamburger + `fixed z-40` slide-over drawer
- Verify `npx tsc --noEmit`

### 4. Rewrite shared components
- **AdminTable**: white bg, gray-200 border, blue hover, system fonts
- **AdminModal**: `bg-black/30 backdrop-blur-sm`, white card, rounded-2xl
- **AdminConfirmDialog**: Cancel (gray border) + Delete (`bg-red-500`)
- **PaginationBar**: blue-600 active page, gray-200 borders
- Verify `npx tsc --noEmit`

### 5. Rewrite login page
- `bg-gray-50` full page, centered white card
- Input: white bg, blue-600 focus ring
- Button: `bg-blue-600 text-white` full-width
- No font-heading, no gold

### 6. Rewrite all 6 section pages
Each page uses consistent classes:
- Input: `bg-white border-gray-200 rounded-lg focus:ring-blue-600/20 focus:border-blue-600`
- Label: `text-xs font-semibold text-gray-500 uppercase`
- Primary btn: `bg-blue-600 text-white rounded-lg hover:bg-blue-700`
- Secondary btn: `bg-white border-gray-200 text-gray-600 hover:bg-gray-50`
- Stats cards: `bg-white border-gray-200 rounded-lg p-4`
- Skeleton: `bg-gray-100 animate-pulse rounded-lg`
- Error: `text-red-500`, Empty: centered gray text

### 7. Build verification
- `npx next build` — zero errors
- Visual: no cursor effects, no gold, sidebar pushes content, mobile drawer works

---

## Design Tokens (Tailwind)

```
Page bg:       bg-gray-50
Surface:       bg-white
Border:        border-gray-200
Border subtle: border-gray-100
Text primary:  text-gray-900
Text body:     text-gray-700
Text label:    text-gray-500/600
Text muted:    text-gray-400
Accent:        bg-blue-600 text-white
Accent light:  bg-blue-50 text-blue-600
Danger:        bg-red-500 text-white hover:bg-red-600
Success:       text-green-600
Input focus:   focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600
Font:          system-ui, -apple-system, sans-serif (no Playfair Display)
Mono:          font-mono (JetBrains Mono / SF Mono)
```
