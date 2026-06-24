# Admin Panel Redesign Spec

**Date**: 2026-06-24
**Status**: Approved
**Based on**: `docs/superpowers/specs/2026-06-23-admin-panel-design.md`, `docs/superpowers/specs/2026-06-24-code-modification-plan.md`

## Overview

Redesign the admin panel to be a fully independent application, visually and structurally separated from the main portfolio site. The admin panel uses a distinct design system — different fonts, colors, and layout patterns — with no shared UI between the two surfaces.

## 1. Architecture: Three-Layer Layout Isolation

```
app/
  layout.tsx                    ← Root shell: <html>, <body>, globals.css ONLY.
                                   No LanguageProvider, SiteNav, SiteFooter, CursorScript.

  (site)/                       ← Public site route group
    layout.tsx                  ← LanguageProvider + SiteNav + SiteFooter + CursorScript + aurora
    page.tsx, skills/, projects/, experience/, lab/

  admin/
    layout.tsx                  ← 【CHANGED】CSS Grid layout with sidebar.
                                   Detects /admin/login → renders minimal wrapper.
                                   All other paths → Grid: [sidebar 220px] [content 1fr].
    login/
      page.tsx                  ← Standalone centered login card. No sidebar.
    page.tsx                    ← Redirect to /admin/experiences
    experiences/page.tsx
    projects/page.tsx
    skills/page.tsx
    guestbook/page.tsx
    visits/page.tsx
    profile/page.tsx
```

**Key change from current state**: Delete `admin/(dashboard)/layout.tsx`. All dashboard pages move up one level to `admin/`. The Grid layout lives in `admin/layout.tsx`. Login detection done via a thin `"use client"` wrapper that checks `usePathname()`.

## 2. Layout: CSS Grid Push Pattern

**No fixed positioning.** Sidebar is a grid column, not a fixed overlay.

```css
.admin-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}
```

- **Sidebar**: 220px fixed width, white background, border-right
- **Content**: 1fr, `bg-gray-50`, scrollable
- **Mobile** (< 1024px): sidebar becomes a slide-over drawer triggered by hamburger button. Uses `transform: translateX(-100%)` toggle. Content takes full width.

## 3. Design System: Clean Professional

### Colors

| Role | Value | Usage |
|---|---|---|
| Page background | `#f5f5f5` (gray-50) | Content area |
| Surface | `#ffffff` | Sidebar, cards, tables, modals |
| Border | `#e5e5e5` (gray-200) | Card borders, table borders, inputs |
| Border subtle | `#f0f0f0` (gray-100) | Table row dividers |
| Text primary | `#111111` / `#333333` | Headings, body text |
| Text secondary | `#666666` | Labels, metadata |
| Text muted | `#999999` | Placeholders, hints |
| **Accent** | `#2563eb` (blue-600) | Active nav, buttons, links, focus rings |
| Accent light | `#eff6ff` (blue-50) | Active nav background |
| Danger | `#ef4444` (red-500) | Delete buttons, confirm dialogs |
| Success | `#16a34a` (green-600) | Save confirmation |

### Typography

**No Playfair Display, no serif.** System sans-serif stack only:

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

- Headings: 18px/700
- Body: 13px/500
- Labels: 11px/600 uppercase
- Mono (IDs, code): 12px JetBrains Mono / SF Mono

### No Shared Elements

Admin layout does NOT import or render:
- `CursorScript` / cursor divs
- `SiteNav` / `SiteFooter`
- `LanguageProvider`
- `aurora` section
- Any component from `src/components/pages/`
- Any gold/terracotta/sage color tokens from the main site

## 4. Components

### AdminSidebar

- White background, `border-r border-gray-200`
- Top: "Admin" brand + "Portfolio CMS" subtitle
- Nav items: emoji icon + label, 13px/600
  - Active: `bg-blue-50 text-blue-600`
  - Inactive: `text-gray-600`, hover: `text-gray-900 bg-gray-50`
- Bottom: "← Back to site" link + "Sign out" button, both text-gray-400
- Mobile: hamburger button top-left, slide-over with backdrop overlay

### AdminTable

- White background, `border border-gray-200`, rounded-lg
- Header row: `bg-gray-50`, 11px uppercase labels
- Data rows: zebra `bg-white` / `bg-gray-50/50`
- Empty state: centered icon + gray text + no-action message
- Row hover: `bg-blue-50/30` (only if row clickable)

### AdminModal

- Centered overlay: `bg-black/30 backdrop-blur-sm`
- Card: white, rounded-xl, max-w-lg, shadow-lg
- Header: title text (18px/700) + X close button
- Close on Escape key or overlay click

### AdminConfirmDialog

- Wraps AdminModal
- Message text: gray-600
- Buttons: Cancel (gray border) | Delete (red-500, white text)

### PaginationBar

- "Show [select] of N" on left
- Page numbers on right with Prev/Next
- Active page: `bg-blue-600 text-white`
- Inactive: `text-gray-600 hover:bg-gray-100`
- Smart ellipsis for long page ranges

### Form Inputs

```css
input, textarea, select {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #111;
}
input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  outline: none;
}
```

### Buttons

- **Primary**: `bg-blue-600 text-white`, hover: `bg-blue-700`, rounded-lg
- **Secondary**: `bg-white text-gray-600 border-gray-200`, hover: `bg-gray-50`
- **Danger**: `bg-red-500 text-white`, hover: `bg-red-600`
- Font: 13px/600

### Loading Skeletons

- `bg-gray-100 animate-pulse`, rounded-lg
- Match the height of the content they replace (table rows, cards)

### States

Each section page handles:
- **Loading**: skeleton placeholders
- **Error**: red text + "Retry" link/button
- **Empty**: centered icon + description + optional CTA
- **Data**: table/cards with action buttons

## 5. Page Structure

### Login (`/admin/login`)

Detected in admin layout by pathname — renders a minimal full-screen centered card:
- Gray-50 background, no sidebar
- White card, rounded-2xl, shadow-sm
- Password input with focus ring
- Blue "Sign In" button
- "← Back to site" link below card
- On mount: check `/api/admin/auth/check`, redirect if already authed

### Dashboard Sections

Each section page has the same top-level structure:

```
┌──────────────────────────────────────────┐
│ Page Title          [+ New] button       │ ← flex justify-between
│ Subtitle text                            │
├──────────────────────────────────────────┤
│ [Stat Card] [Stat Card] (optional)       │ ← stats row
├──────────────────────────────────────────┤
│ Table with data                          │ ← AdminTable
├──────────────────────────────────────────┤
│ Pagination Bar                           │ ← PaginationBar
└──────────────────────────────────────────┘
```

**Stats cards**: Only on pages where it adds value (visits page has total visits counter). White background, border-gray-200, rounded-lg.

### Experiences Page

- Stats: Total count + Latest year
- Table columns: Year (mono) | Title | Actions (Edit/Del)
- Modal form: Year, Title, Description (textarea), Note

### Projects Page

- Table columns: ID (mono) | Title | Tags (gray badges) | Actions
- Modal form: ID slug (create only), Title, Summary, Tags (comma-sep), Demo URL, Repo URL, Video Hint

### Skills Page

- Category table + tab selector for skills per category
- Category tabs: `bg-gray-100` default, `bg-blue-600 text-white` active
- Skill table: Name | Proficiency | Edit/Del
- Languages: separate modal with `lang: name` textarea
- Reorder: handled via API (no drag UI in v1 — reorder via sort_order field editing)

### Guestbook Page

- Read-only table: Author | Message | Date | Del
- Paginated, newest first

### Visits Page

- Hero stat card: total visits in large heading
- Table: Page path (mono) | Visit count

### Profile Page

- Form-based, no table
- Fields: Name, Role, Tagline, Location Pool (JSON textarea), Songs Pool (JSON textarea), Stack (JSON textarea)
- Save button with "✓ Saved" feedback (2s auto-dismiss)

## 6. Implementation Scope

### Files to Change

| File | Action |
|---|---|
| `app/admin/layout.tsx` | Rewrite — CSS Grid, login detection |
| `app/admin/(dashboard)/layout.tsx` | **Delete** |
| `app/admin/(dashboard)/page.tsx` | Move to `app/admin/page.tsx` |
| `app/admin/(dashboard)/*/page.tsx` (6 files) | Move to `app/admin/*/page.tsx` |
| `src/components/admin/AdminSidebar.tsx` | Rewrite — clean professional style, no fixed |
| `src/components/admin/AdminTable.tsx` | Rewrite — blue accent, system fonts |
| `src/components/admin/AdminModal.tsx` | Rewrite — blue accent |
| `src/components/admin/AdminConfirmDialog.tsx` | Rewrite — consistent colors |
| `src/components/admin/PaginationBar.tsx` | Rewrite — blue accent |
| `app/admin/login/page.tsx` | Rewrite — blue accent, system fonts |
| ALL 6 section pages | Rewrite — blue accent, stats cards, new style |

### Files NOT Changed

- All API routes (`src/app/api/admin/*`) — unchanged
- All data access layers (`src/lib/*-db.ts`) — unchanged
- Public site (everything in `(site)/`) — unchanged
- Root `layout.tsx` — unchanged
- `.env.local`, `portfolio.db` — unchanged

### Approach

Single-agent sequential rewrite. Order: layout → components → login → section pages. Build verification after each batch.
