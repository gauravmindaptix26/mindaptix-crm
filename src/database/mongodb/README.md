# MongoDB Architecture

This project uses a single application database for business data:

- `MindaptixCRM`

System databases such as `admin` and `local` are managed by MongoDB itself and should not be used for application records.

## Recommended database strategy

For production, keep one business database per environment:

- `MindaptixCRM_dev`
- `MindaptixCRM_staging`
- `MindaptixCRM_prod`

Do not split databases by role such as admin database, employee database, or sales database.
Roles should be handled by application authorization, not by separate databases.

## Current domain folders

- `models/workforce`
  Users, sessions, attendance, leaves.
- `models/operations`
  Projects, tasks, daily updates.
- `models/sales`
  Client pitch tracker and lead records.
- `models/system`
  Notifications and settings.
- `models/shared`
  Shared schema options.

## Current collections

### `users`

Purpose:
- all user accounts in one place
- super admin, manager, employee, and sales users

Saved data:
- full name
- email
- phone
- joining date
- document name and document url
- password hash
- role
- manager id
- status
- assigned project ids
- tech stack
- assigned lead ids

Main schema:
- `src/database/mongodb/models/workforce/user.ts`

### `usersessions`

Purpose:
- active login sessions

Saved data:
- user id
- session token hash
- expiry
- user agent
- ip address

Main schema:
- `src/database/mongodb/models/workforce/user-session.ts`

### `attendances`

Purpose:
- daily check-in and check-out records

Saved data:
- user id
- date key
- check-in time
- check-out time
- attendance status

Main schema:
- `src/database/mongodb/models/workforce/attendance.ts`

### `leaverequests`

Purpose:
- employee leave workflow

Saved data:
- user id
- leave type
- start date
- end date
- reason
- review status
- reviewed by user id
- reviewed at

Main schema:
- `src/database/mongodb/models/workforce/leave-request.ts`

### `projects`

Purpose:
- project master records

Saved data:
- project name
- project summary
- status
- priority
- due date
- assigned user ids
- created by user id

Main schema:
- `src/database/mongodb/models/operations/project.ts`

### `tasks`

Purpose:
- assigned work items per employee

Saved data:
- title
- description
- assigned user id
- assigned by user id
- due date
- status
- priority
- labels
- attachments
- comments
- completed at

Main schema:
- `src/database/mongodb/models/operations/task.ts`

### `dailyupdates`

Purpose:
- employee DSR entries

Saved data:
- user id
- project id
- work date
- summary
- accomplishments
- blockers
- next plan
- attachments

Main schema:
- `src/database/mongodb/models/operations/daily-update.ts`

### `salesleads`

Purpose:
- sales pipeline and client pitch tracker

Saved data:
- sales user id
- client name
- client phone
- client email
- selected technologies
- meeting link
- meeting date
- meeting time
- client budget
- pitched price
- expected delivery date

Main schema:
- `src/database/mongodb/models/sales/sales-lead.ts`

### `notifications`

Purpose:
- in-app alerts and reminders

Saved data:
- recipient user id
- actor user id
- notification type
- title
- message
- action url
- source key
- read at

Main schema:
- `src/database/mongodb/models/system/notification.ts`

### `settings`

Purpose:
- company-level configuration

Saved data:
- key
- company name
- work start
- work end
- leave policy

Main schema:
- `src/database/mongodb/models/system/setting.ts`

## What is calculated, not stored

These values are derived at runtime from the collections above:

- dashboard totals
- summary cards
- charts and graphs
- monthly reports
- attendance percentages
- leave usage totals
- DSR missing counts
- project status snapshots

Main read-model builder:
- `src/features/dashboard/data.ts`

## If business scope grows later

These collections can be added later when needed:

- `clients`
  If project/client relationship becomes more detailed
- `payments`
  If you want real finance tracking instead of summary placeholders
- `meetings`
  If meetings should be first-class records instead of task-derived entries
- `auditlogs`
  If you want formal action history for approvals, edits, and deletes
- `departments`
  If the company structure grows beyond manager-user mapping

## Quick lookup

- "Where is Mongo connection?"
  `src/database/mongodb/connect.ts`
- "Where are all model exports?"
  `src/database/mongodb/models/index.ts`
- "Where is app-facing Mongo barrel?"
  `src/database/mongodb/index.ts`
