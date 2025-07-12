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