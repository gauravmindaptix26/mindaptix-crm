# Project Structure

## Goal

This project is organized by responsibility so a new developer can find logic quickly without tracing random files.

## Top-Level

- `src/app`
  Route layer only. Keep pages, layouts, and route handlers here.
- `src/actions`
  Server actions only. Form submissions and mutation logic live here.
- `src/components`
  UI only. Keep rendering and client interaction here, not DB logic.
- `src/lib`
  Shared non-UI logic: auth, DB connection, models, dashboard queries, uploads, notifications.
- `docs`
  Project docs and database docs.
- `public/uploads`
  Runtime file storage for employee documents, task attachments, and DSR attachments.

## `src/app`

- `src/app/(auth)`
  Login and register routes.
- `src/app/dashboard`
  Dashboard layout, home page, and dynamic dashboard pages.

Rule:
- Route files should fetch data or call server actions, but should not contain large business logic blocks.

## `src/actions`

Files are grouped by business action:

- `auth.ts`
- `user-management.ts`
- `project-management.ts`
- `attendance.ts`
- `task-management.ts`
- `leave-management.ts`
- `daily-updates.ts`
- `settings.ts`

Rule:
- Keep validation, permissions, DB writes, and revalidation here.

## `src/components`

- `src/components/auth`
  Auth screens and auth feedback components.
- `src/components/dashboard`
  One panel per dashboard section:
  attendance, tasks, leaves, DSR, reports, employees, settings, shell, overview.
- `src/components/ui`
  Small reusable primitives like button, card, text field.

Rule:
- Components should receive typed data from `src/lib/dashboard/dashboard-data.ts` instead of querying DB directly.

## `src/lib`

### `src/lib/auth`

- session lookup
- password hashing
- role definitions
- admin helper functions
- form state types

### `src/lib/dashboard`

- `config.ts`
  Dashboard navigation and route access rules.
- `team-scope.ts`
  Manager/team visibility rules.
- `dashboard-data.ts`
  Main read-model layer for dashboard pages.

### `src/lib/models`

All Mongoose schemas:

- users
- user sessions
- attendance
- leaves
- tasks
- DSR updates
- projects
- settings
- notifications

### `src/lib/uploads`

- `shared.ts`
  Base file-save helper.
- `employee-documents.ts`
  Employee document upload helper.
- `work-attachments.ts`
  Task and DSR attachment helpers.

### `src/lib/notifications.ts`

Notification creation and reminder sync logic.

## Naming Rules

- Route and component files should describe what they render:
  `tasks-panel.tsx`, `dashboard-shell.tsx`
- Server action files should describe what they mutate:
  `task-management.ts`, `leave-management.ts`
- Data/query files should describe what they provide:
  `dashboard-data.ts`
- Avoid vague names like `mvp-data`, `temp`, `new-file`, `final-file`

## Safe Extension Pattern

When adding a new feature:

1. Add or update schema in `src/lib/models`
2. Add mutation in `src/actions`
3. Add read/query shaping in `src/lib/dashboard/dashboard-data.ts` if dashboard needs it
4. Render it in `src/components/...`
5. Wire the route in `src/app/...` only if needed

## Cleanup Applied

The following unused/stale files were removed to reduce confusion:

- legacy RBAC request helper files not used by current app
- legacy Mongoose RBAC plugin not used by current app
- dev-only auth debug route not used by current app

## Important Limitation

This cleanup intentionally avoids large folder moves that could break imports or UI behavior. The structure is improved for readability, but the app remains compatible with the existing UI and workflows.
