# Job System

This directory contains scheduled jobs that run automatically based on configuration settings.

## Available Jobs

### Create Ticket Job (`create-ticket.ts`)

This job automatically creates fake support tickets using the faker service.

**Configuration:**
- `ACTIVATE_CREATE_TICKET_JOB`: Set to `"true"` to enable the job, any other value disables it
- `CREATE_TICKET_JOB_INTERVAL`: Cron expression for job frequency (default: `0 */1 * * *` = every hour)

**Example cron expressions:**
- `*/5 * * * *` - Every 5 minutes
- `0 */1 * * *` - Every hour
- `0 9 * * *` - Every day at 9 AM
- `0 9 * * 1` - Every Monday at 9 AM

### Action Item Backfill Job (`action-items-generator.job.ts`)

Manually generate (or regenerate) action items for insights within a specific time range. This utility is not scheduled by default—call it from a script, REPL, or temporary route when you need to backfill historical insights.

```ts
import { runActionItemsGenerationJob } from '../jobs/action-items-generator.job';

await runActionItemsGenerationJob({
  startDate: '2024-10-01T00:00:00.000Z', // optional
  endDate: '2024-10-31T23:59:59.999Z',   // optional
  userId: '<system-user-id>',            // optional
  forceRegeneration: false               // skip insights that already have action items
});
```

- When `startDate` is omitted, the job scans from the earliest insight on record.
- When `endDate` is omitted, the job runs through "now".
- Set `forceRegeneration` to `true` if you need to recreate action items even when some already exist (use cautiously to avoid duplicates).

## How to Use

1. Set the environment variables in your `.env` file:
   ```
   ACTIVATE_CREATE_TICKET_JOB=true
   CREATE_TICKET_JOB_INTERVAL=*/10 * * * *
   ```

2. The jobs will automatically start when the server starts up

3. Check the server logs to see job execution status

## Adding New Jobs

1. Create a new job file in the `jobs/` directory
2. Export a function that starts the job
3. Import and call the function in `jobs/index.ts`
4. The job will automatically be started when the server initializes

## Job Management

Jobs are managed through the `startAllJobs()` function in `jobs/index.ts`. This function is called during server initialization in `server.ts`. 