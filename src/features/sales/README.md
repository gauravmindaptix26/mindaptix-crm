# Sales Module Blueprint

This CRM now has a sales foundation built around these MongoDB models:

- `SalesLead`
  First-touch lead register with source, status, priority, meeting, follow-up, value, and close expectations.
- `SalesCustomer`
  Converted or active customer records for repeat work and billing visibility.
- `SalesFollowUp`
  Pending, completed, missed, and rescheduled follow-up queue.
- `SalesDeal`
  Commercial opportunity tracker from discovery to won/lost.
- `SalesPayment`
  Invoice-level collection visibility for pending, partial, paid, and overdue amounts.
- `SalesTarget`
  Monthly target, achieved amount, and incentive snapshot per sales rep.

## Current workflow in code

- Leadership can create a lead from the dashboard sales workspace.
- When a lead is created:
  - the lead is stored in `SalesLead`
  - an initial `SalesFollowUp` is created if `nextFollowUpDate` is present
  - a `SalesDeal` is created if `pitchedPrice > 0`
  - a `SalesCustomer` is created when lead status is `WON`

## Suggested API surface

This repo currently uses Next.js server actions for operational writes. If you later add REST routes, these are the recommended resources:

- `GET /api/sales/leads`
- `POST /api/sales/leads`
- `PATCH /api/sales/leads/:leadId`
- `GET /api/sales/follow-ups`
- `POST /api/sales/follow-ups`
- `PATCH /api/sales/follow-ups/:followUpId`
- `GET /api/sales/deals`
- `POST /api/sales/deals`
- `PATCH /api/sales/deals/:dealId`
- `GET /api/sales/payments`
- `POST /api/sales/payments`
- `PATCH /api/sales/payments/:paymentId`
- `GET /api/sales/targets`
- `POST /api/sales/targets`
- `PATCH /api/sales/targets/:targetId`

## Recommended permissions

- `SUPER_ADMIN`
  Full access across all sales entities.
- `MANAGER`
  Full operational visibility and write access for sales team management.
- `SALES`
  Scoped read and write access to their own leads, follow-ups, deals, customers, payments, and targets.

## Next expansion points

- add dedicated create/update actions for follow-ups, deals, payments, and targets
- add lead conversion action that closes deal and opens customer billing
- add reminder notifications for due follow-ups and overdue payments
- add reports page widgets for source-wise conversion and target achievement
