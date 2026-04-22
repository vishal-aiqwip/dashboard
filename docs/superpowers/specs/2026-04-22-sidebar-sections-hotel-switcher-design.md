# Sidebar Sections + Hotel Switcher — Design

**Date:** 2026-04-22
**Scope:** UI only — sidebar component tree. No new pages/routes are created; links may 404 until pages exist.

## Goal

Replace the current flat `NavMain` list in `AppSidebar` with:

1. A **hotel switcher** at the top (admin-only).
2. Five **collapsible nav sections** (ADMIN, CHATBOT, EMAIL, GENERAL, BETA FEATURES), where only the section containing the currently-active route is expanded by default.

All items from the reference screenshot are visible to every signed-in user; only the hotel switcher is role-gated.

## Files

### New

- `src/config/sidebar-nav.ts` — hardcoded nav data + hotel list.
- `src/layouts/_components/hotel-switcher.tsx` — hotel dropdown with admin gating handled by the parent.
- `src/layouts/_components/nav-section.tsx` — one collapsible section. Replaces the single-group `NavMain`.

### Modified

- `src/layouts/_components/app-sidebar.tsx` — renders `<HotelSwitcher>` (when `role === 'admin'`) plus a mapped list of `<NavSection>`. Remove inline `adminNav` / `userNav` arrays and the `NavMain` import.

### Deleted

- `src/layouts/_components/nav-main.tsx` — no remaining callers after `app-sidebar.tsx` is updated.

## Data shape

```ts
// src/config/sidebar-nav.ts
import type { ComponentType } from 'react';

export type NavItem = {
  title: string;
  url: string;
  icon?: ComponentType<{ className?: string }>;
};

export type NavSectionConfig = {
  id: string;        // stable key, e.g. 'admin'
  label: string;     // 'ADMIN'
  items: NavItem[];
};

export type Hotel = {
  id: string;
  name: string;
};

export const NAV_SECTIONS: NavSectionConfig[] = [ /* ... */ ];
export const HOTELS: Hotel[] = [ /* ... */ ];
```

### Sections and routes

Kebab-case slugs under `/dashboard/*`. Beta items live under `/dashboard/beta/*` to keep them namespaced.

| Section       | Item                  | Route                                |
|---------------|-----------------------|--------------------------------------|
| ADMIN         | Manage Hotels         | `/dashboard/manage-hotels`           |
| ADMIN         | Manage Users          | `/dashboard/manage-users`            |
| ADMIN         | Onboarding            | `/dashboard/onboarding`              |
| ADMIN         | Email Performance     | `/dashboard/email-performance`       |
| ADMIN         | Email Training Center | `/dashboard/email-training-center`   |
| ADMIN         | Report Assessments    | `/dashboard/report-assessments`      |
| CHATBOT       | Training Center       | `/dashboard/chatbot/training-center` |
| EMAIL         | AI Email Settings     | `/dashboard/email/ai-settings`       |
| GENERAL       | Analytics             | `/dashboard/analytics`               |
| GENERAL       | Users                 | `/dashboard/users`                   |
| BETA FEATURES | Integrations          | `/dashboard/beta/integrations`       |
| BETA FEATURES | Reviews Reports       | `/dashboard/beta/reviews-reports`    |
| BETA FEATURES | Guest Assistant       | `/dashboard/beta/guest-assistant`    |
| BETA FEATURES | Email Inbox           | `/dashboard/beta/email-inbox`        |

Icons: pick sensible matches from `@tabler/icons-react` or `lucide-react` (already in use). Non-blocking — the structure is what matters.

### Hotels (placeholder)

```ts
export const HOTELS: Hotel[] = [
  { id: '123joffeloff', name: '123Joffeloff' },
  { id: 'seaside-resort', name: 'Seaside Resort' },
  { id: 'mountain-lodge', name: 'Mountain Lodge' },
];
```

## Component contracts

### `HotelSwitcher`

```ts
type HotelSwitcherProps = { hotels: Hotel[] };
```

- Renders a `SidebarGroup` with `SidebarGroupLabel` = `YOUR HOTEL`.
- Inside: a `DropdownMenu` trigger styled as a `SidebarMenuButton` showing `[icon] [selected hotel name] [caret]`.
- `DropdownMenuContent` lists hotels; selecting one updates local `useState<string>` for `selectedId` (initialized to `hotels[0].id`).
- No Redux, no persistence for now. State lives inside the switcher. (Easy to lift to Redux later without changing the prop shape.)
- Icon: a building-style icon (e.g. `IconBuilding` from tabler).
- Admin gating is done by the **parent** (`AppSidebar`), not inside this component. Keeps the component single-purpose.

### `NavSection`

```ts
type NavSectionProps = {
  section: NavSectionConfig;
  activeUrl: string;  // current pathname, already normalized
};
```

- Wraps `SidebarGroup` in a shadcn `Collapsible`.
- `SidebarGroupLabel` becomes the `CollapsibleTrigger` — shows section label + a rotating caret (`data-[state=open]:rotate-0`, closed state rotated).
- `SidebarGroupContent` is the `CollapsibleContent` with the items.
- Open state is local `useState<boolean>`, initialized to `section.items.some(i => matches(i.url, activeUrl))`.
- **Single rule:** a `useEffect` keyed on `activeUrl` runs only when the section becomes active (i.e. this section contains the new active item and didn't contain the previous one) and sets `open = true`. It never sets `false`. Inactive sections retain whatever the user last did with them; the active section is guaranteed open on navigation.
- Item rendering: same `SidebarMenuButton` + `Link` pattern as current `nav-main.tsx`, with `isActive` per-item.

### `AppSidebar` (updated)

- Imports `NAV_SECTIONS`, `HOTELS` from `@/config/sidebar-nav`.
- Keeps existing `SidebarHeader` (logo) and `SidebarFooter` (`NavUser`) untouched.
- `SidebarContent`:
  ```tsx
  {role === 'admin' && <HotelSwitcher hotels={HOTELS} />}
  {NAV_SECTIONS.map(section => (
    <NavSection key={section.id} section={section} activeUrl={pathname} />
  ))}
  ```
- `pathname` computed once via `useLocation()` and normalized (reuse the `replace(/\/+$/, '') || '/'` logic).
- The `role` prop is already threaded in; no new props.

## Active-URL matching

Reuse the matcher from `nav-main.tsx` at the item level:

```
isActive(url) = normalized(pathname) === normalized(url)
             || normalized(pathname).startsWith(normalized(url) + '/')
```

Section-level active = any item in the section is active.

`/dashboard` exact-match carve-out stays for `/dashboard` only; none of the new items collide with it.

## Edge cases

- **No active match** (e.g. user on `/dashboard` root): all sections start collapsed. That's intentional — the root route isn't in any section, and the user can expand what they want.
- **Two items match the same path** (shouldn't happen with the route table above, but): both render as active. Section-level open state is still correct.
- **`role === null`** (loading/unknown): no hotel switcher shown. Nav sections still render — they're visible to everyone.
- **Icon-collapsed sidebar** (`collapsible="icon"` on `<Sidebar>`): group labels hide via shadcn's built-in `group-data-[collapsible=icon]:hidden`. Collapsible state stops mattering in this mode. Items still render as icons with tooltips (existing behavior preserved). The hotel switcher trigger also collapses to just its icon — use the existing `group-data-[collapsible=icon]` utility pattern from `NavUser` to keep it compact.

## Out of scope

- Creating routes/pages for the new nav items.
- Persisting selected hotel (Redux, localStorage, API).
- Real hotels API.
- Per-hotel data scoping anywhere else in the app.
- Role-based filtering of nav items.

## Testing

Manual only — no test suite exists in this repo.

1. Sign in as admin → hotel switcher visible, defaults to first hotel, dropdown selects other hotels.
2. Sign in as non-admin → hotel switcher hidden; all nav sections still visible.
3. Navigate to a route in each section → only that section auto-expands.
4. Expand a second section manually → it stays open on next render (no clobbering).
5. Navigate to a route in a closed section → that section auto-opens.
6. Collapse sidebar to icon mode → group labels hide, items show as icon tooltips, hotel switcher trigger collapses to icon.
