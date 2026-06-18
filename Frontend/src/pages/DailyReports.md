# Daily Status Report — setup notes

A read-only report screen that mirrors your daily standup sheet (Employee, Project,
Working Status, Done Yesterday, Today's Plan, Risks, Dependencies) plus Hours Spent,
built on your existing `daily_updates` table.

## 1. Run the migration

`sql/2026_06_extend_daily_updates.sql` adds two columns to `daily_updates`:

- `working_status` (varchar) — e.g. "In-Progress", "Practicing", "Completed", "Blocked"
- `dependencies` (text) — free text

Everything else reuses columns you already have:

| Screen column   | DB column                          |
|------------------|-------------------------------------|
| Employee Name    | `users.name` (via `user_id`)        |
| Project          | `projects.project_name` (via `project_id`) |
| Working Status   | `daily_updates.working_status` (new)|
| Hours Spent      | `daily_updates.hours_spent`         |
| Done Yesterday   | `daily_updates.remarks`             |
| Today's Plan     | `daily_updates.todays_task`         |
| Risks            | `daily_updates.risk_level` + `risk_description` |
| Dependencies     | `daily_updates.dependencies` (new)  |

Run it against your `quantify` database before anything else.

## 2. Backend

Files under `backend/`:

- `db.js` — mysql2 pool (skip if you already have one; just reuse yours).
- `controllers/dailyUpdates.controller.js` — query logic.
- `routes/dailyUpdates.routes.js` — the two endpoints.
- `server.example.js` — reference only. If you already have an Express app, just
  copy the one line `app.use('/api', dailyUpdatesRoutes);` into it.

Install what's missing: `npm install mysql2 express cors dotenv`

### Endpoints

**GET `/api/daily-updates/meta`**
Returns filter options for the screen:
```json
{
  "dates": ["2026-06-05", "2026-06-04", ...],
  "employees": [{ "id": 39, "name": "Mr. Veeranna Bedasur" }, ...],
  "projects": [{ "id": 2, "project_name": "ERP" }, ...]
}
```

**GET `/api/daily-updates?date=2026-06-05&project_id=2&user_id=39`**
`date` is required (YYYY-MM-DD); `project_id` and `user_id` are optional filters.
Returns an array of rows with `employee_name`, `project_name`, `working_status`,
`hours_spent`, `done_yesterday`, `todays_task`, `risk_level`, `risk_description`,
`dependencies`.

## 3. Frontend

`frontend/DailyUpdatesReport.jsx` + `DailyUpdatesReport.css` — drop both into your
React app. On mount it loads the filter options, defaults to the most recent date,
and fetches that day's rows. Changing the date, project, or employee dropdown
re-fetches automatically. SLNO is just the row's position in the current view, not
a stored column.

Set `API_BASE` at the top of the .jsx file if your API isn't mounted at `/api`
relative to where the React app is served.

## Notes / things you may want to tweak

- `working_status` is a free-text varchar, not an enum, so any value you write to
  it will render as a badge (unrecognized values fall back to a neutral gray badge).
  If you want a fixed list, change the column to an `ENUM` in the migration.
- The migration backfills `working_status = 'In-Progress'` for existing rows that
  have a `project_id` set, just so old data doesn't render with empty badges —
  delete that `UPDATE` statement if you'd rather leave history blank.
- This screen is read-only by design (per your answer). If you later want
  add/edit, the same controller file is a natural place to add `POST`/`PUT` handlers.