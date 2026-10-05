# Operations — NEW-CONVERT-FOLLOW-UP-APP

## E2E (Phase 9 gate)

Prereqs: Postgres running, migrations applied, dev server up.

```bash
docker compose up -d            # or native Postgres 16
npx prisma migrate dev
npm run dev                     # hilltopapps.local:3000 in another shell:
npx playwright install chromium # first time only
npx playwright test             # runs e2e/john-journey.spec.ts
npx playwright test --list      # verify discovery without browsers
```

`npm run test:e2e` is the same as `npx playwright test`.

## Backup & restore (local Postgres)

Scheduled `pg_dump` (Windows Task Scheduler, daily):

```powershell
$stamp = Get-Date -Format "yyyyMMdd"
pg_dump -U postgres -d followup -F c -f "D:\backups\followup-$stamp.dump"
```

Restore test (quarterly):

```powershell
pg_restore -U postgres -d followup_restore "D:\backups\followup-<date>.dump"
```

R2: enable bucket versioning in Cloudflare dashboard.

## Release gate — 5 YES (evidence)

1. **Register every new person easily?** YES — `/people/new`, <60s, required-only fields.
2. **Every person has clear responsibility?** YES — assign on profile, Unassigned queue, reassignment keeps history.
3. **Every worker sees what to do?** YES — `/today` (due/overdue/awaiting/concerns), `/follow-ups`, `/alerts`.
4. **Leadership sees neglect/inactivity?** YES — `/admin` health, attendance concerns, pastoral queue.
5. **Progress measurable?** YES — `/reports` (coverage, first-contact, funnel, integration rate) + CSV export.

## Perf notes

- Hot paths indexed: `Person(nextFollowUpAt)`, `FollowUp(personId, workerId)`,
  `Assignment(personId)`, `AttendanceRecord(personId)` (migration `0002_indexes`).
- Lists capped at 100–500 rows; reports at 2000–5000 rows for CSV.
- Load target: Today <2s at 10k people — re-verify with seeded data before scale-up.
