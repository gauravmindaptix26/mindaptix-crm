# Database Structure

This project currently uses MongoDB with Mongoose, so "tables" are implemented as collections.

## Minimum Core Collections

### `users`

Current fields in code:

- `_id`
- `fullName`
- `email`
- `phone`
- `joiningDate`
- `documentName`
- `documentUrl`
- `passwordHash`
- `role`
- `managerId`
- `status`
- `projectIds`
- `leadIds`
- `createdAt`
- `updatedAt`

Compared to your simple start:

- `id` -> present as `_id`
- `name` -> currently `fullName`
- `email` -> present
- `password` -> currently stored as `passwordHash`
- `role` -> present
- `manager_id` -> now supported as `managerId`

Important note:

- Manager-to-team mapping now supports a dedicated `managerId` field.
- Legacy task-based team visibility is still used as a fallback for older records.

### `tasks`

Current fields in code:

- `_id`
- `title`
- `description`
- `assignedUserId`
- `assignedByUserId`
- `status`
- `dueDate`
- `createdAt`
- `updatedAt`

Compared to your simple start:

- `assigned_to` -> currently `assignedUserId`
- `assigned_by` -> currently `assignedByUserId`
- `deadline` -> currently `dueDate`

### `dsr_reports`

Current collection name in code:

- `DailyUpdate`

Current fields:

- `_id`
- `userId`
- `projectId`
- `workDate`
- `summary`
- `accomplishments`
- `blockers`
- `nextPlan`
- `createdAt`
- `updatedAt`

Compared to your simple start:

- `work_done` -> currently `accomplishments`
- `next_plan` -> currently `nextPlan`
- `date` -> currently `workDate`

Extra field used by current code:

- `projectId`
- `summary`

Persistence behavior:

- same employee and same work date now update a single daily row instead of creating duplicate DSR entries

### `attendance`

Current fields:

- `_id`
- `userId`
- `dateKey`
- `checkInAt`
- `checkOutAt`
- `status`
- `createdAt`
- `updatedAt`

Compared to your simple start:

- `check_in` -> currently `checkInAt`
- `check_out` -> currently `checkOutAt`
- `date` -> currently `dateKey`

Extra field used by current code:

- `status` with values like `PRESENT` and `COMPLETED`

### `leaves`

Current collection name in code:

- `LeaveRequest`

Current fields:

- `_id`
- `userId`
- `leaveType`
- `startDate`
- `endDate`
- `reason`
- `status`
- `reviewedByUserId`
- `createdAt`
- `updatedAt`

Compared to your simple start:

- `type` -> currently `leaveType`
- `from_date` -> currently `startDate`
- `to_date` -> currently `endDate`
- `status` -> present

Extra fields used by current code:

- `reason`
- `reviewedByUserId`

## Collections Also Used By Current Code

These are database-backed parts of the app that are active right now and should not be ignored.

### `projects`

Used for:

- assigning employees to projects
- linking DSR reports to projects
- dashboard summaries

Fields:

- `_id`
- `name`
- `summary`
- `status`
- `priority`
- `dueDate`
- `assignedUserIds`
- `createdByUserId`
- `createdAt`
- `updatedAt`

### `settings`

Used for:

- company name
- working hours
- leave policy

Fields:

- `_id`
- `key`
- `companyName`
- `workStart`
- `workEnd`
- `leavePolicy`
- `createdAt`
- `updatedAt`

### `user_sessions`

Current collection name in code:

- `UserSession`

Used for:

- login sessions
- logout and expiry handling

Fields:

- `_id`
- `userId`
- `sessionTokenHash`
- `expiresAt`
- `userAgent`
- `ipAddress`
- `createdAt`
- `updatedAt`

## `roles` Collection Status

Your proposed structure includes a `roles` table, but the current code does not use a separate `roles` collection.

Roles are currently stored as enum values in code:

- `SUPER_ADMIN`
- `MANAGER`
- `EMPLOYEE`
- `SALES`

So right now:

- `roles` collection does not exist
- user role permissions are handled in code, mainly through `src/lib/auth/rbac.ts`

## Current Database Design Decisions In Code

### Team ownership

Current implementation:

- manager team scope primarily uses `users.managerId`
- older task-based team mapping from `assignedByUserId` is still used as a fallback

### Dates

Current project mixes:

- `Date` values for `joiningDate`, `checkInAt`, `checkOutAt`, `expiresAt`, `dueDate` in projects
- string dates for `dateKey`, `workDate`, `startDate`, `endDate`, `dueDate` in tasks

This works, but it is not fully normalized.

### Naming

Current code uses camelCase field names, not snake_case.

Examples:

- `assignedUserId` instead of `assigned_to`
- `assignedByUserId` instead of `assigned_by`
- `leaveType` instead of `type`
- `workDate` instead of `date`

## Recommended Simple Structure For This Codebase

If you want a simple structure that still fits the current app, this is the practical version:

### `users`

- `_id`
- `fullName`
- `email`
- `passwordHash`
- `role`
- `status`
- `managerId`
- `phone`
- `joiningDate`
- `projectIds`

### `tasks`

- `_id`
- `title`
- `description`
- `assignedUserId`
- `assignedByUserId`
- `status`
- `dueDate`

### `dsr_reports`

- `_id`
- `userId`
- `projectId`
- `workDate`
- `summary`
- `accomplishments`
- `blockers`
- `nextPlan`

### `attendance`

- `_id`
- `userId`
- `dateKey`
- `checkInAt`
- `checkOutAt`
- `status`

### `leaves`

- `_id`
- `userId`
- `leaveType`
- `startDate`
- `endDate`
- `reason`
- `status`
- `reviewedByUserId`

### `projects`

- `_id`
- `name`
- `summary`
- `status`
- `priority`
- `dueDate`
- `assignedUserIds`
- `createdByUserId`

### `user_sessions`

- `_id`
- `userId`
- `sessionTokenHash`
- `expiresAt`

### `settings`

- `_id`
- `key`
- `companyName`
- `workStart`
- `workEnd`
- `leavePolicy`

## Key Gap Summary

Main differences between your draft and the current code:

1. There is no separate `roles` collection right now.
2. There is no direct `manager_id` on `users` right now.
3. `projects`, `settings`, and `user_sessions` are also required by the current code.
4. DSR, leave, task, and attendance field names differ from your draft but map cleanly.
5. Current code stores more operational fields than the bare minimum, especially for auth and admin flows.
