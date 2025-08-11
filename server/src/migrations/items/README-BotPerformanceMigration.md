# Bot Performance Data Migration

## Overview

This migration (`AddBotPerformanceDataMigration`) adds mock bot performance data to existing Qdrant ticket points to enable the insights dashboard to display meaningful data.

## What it does

The migration adds the following bot performance fields to existing Qdrant points:
- `bot_processed`: Boolean indicating if the bot processed the ticket (80% chance)
- `bot_actions`: Array of actions taken by the bot (auto_reply, refund, coupon, auto_resolve, escalate)
- `resolution_source`: How the ticket was resolved (bot, human, hybrid)
- `bot_processing_time`: Time taken by bot in milliseconds (1-10 seconds)
- `bot_confidence_score`: Bot's confidence score (0.1-1.0)
- `escalated_to_human`: Whether the ticket was escalated to human
- `bot_model_version`: AI model version used

## Data Generation Strategy

The migration generates realistic mock data based on the following logic:

### Bot Processing (80% of tickets)
- **Simple actions** (auto_reply only): High success rate (80%), fast processing (1-3s), high confidence (85-90%)
- **Complex actions** (refunds, coupons): Medium success rate (85%), medium processing (3-5s), medium confidence (70-85%)
- **Escalations**: Low success rate (60%), slow processing (5-8s), low confidence (40-60%)

### Human Processing (20% of tickets)
- All fields set to indicate manual handling
- No bot processing time or confidence scores

### Consistency
- Uses deterministic pseudo-random generation based on point ID
- Same point will always get the same mock data
- Reproducible results across multiple runs

## How to run

### Option 1: Via API (Recommended)

Run the specific migration:
```bash
POST /api/v1/migrations/run/add-bot-performance-data
```

Or run all available migrations:
```bash
POST /api/v1/migrations/run-all
```

### Option 2: Check migration status

Get current migration status:
```bash
GET /api/v1/migrations/status
```

Get migration history:
```bash
GET /api/v1/migrations/history
```

## Expected Results

- **Collection**: `tickets_v2` in Qdrant
- **Processing**: Updates points in batches of 100
- **Performance**: Processes ~1000-2000 points per minute
- **Safety**: Only updates points that don't already have bot performance data
- **Verification**: Counts updated points at the end

## Sample Output

### Successful Migration Output:
```
🚀 Starting add-bot-performance-data migration...
📋 Migration Details:
   - Name: add-bot-performance-data
   - Version: 1.0.0
   - Target Collection: tickets_v2
   - Database Type: qdrant
   - Timestamp: 2024-01-15T10:30:00.000Z

🌍 Environment Information:
   - Node.js Version: v18.18.0
   - Platform: darwin
   - Working Directory: /path/to/server

🔧 Qdrant Configuration:
   - QDRANT_URL: https://your-qdrant.cloud
   - QDRANT_API_KEY: ***set***

🔌 Initializing Qdrant connection...
   - Qdrant Service initialized: true
   - Qdrant Client available: true

🔍 Checking if collection "tickets_v2" exists...
✅ Successfully retrieved collections list
   - Total collections found: 3
   - Available collections: tickets_v2, vectors, embeddings

✅ Collection "tickets_v2" found

🔍 Counting points without bot performance data...
✅ Successfully executed count query
📊 Found 1500 points without bot performance data

📊 Batch Processing Setup:
   - Total points to process: 1500
   - Batch size: 100
   - Estimated total batches: 15
   - Starting offset: 0

🔄 === BATCH 1/15 (0%) ===
   - Offset: 0
   - Limit: 100
   - Expected range: 0 to 99

📖 Reading batch 1...
📥 Batch 1 read completed in 245ms
   - Points retrieved: 100
   - Expected points: 100

🔧 Transforming batch 1 with bot performance data...
🔧 Batch 1 transformation completed in 15ms
   - Points transformed: 100

🔍 DIAGNOSTIC - First point structure:
   - Point ID: 12345-abcd-6789
   - Bot Performance Fields:
     • bot_processed: true
     • bot_actions: ["auto_reply"]
     • resolution_source: bot
     • bot_processing_time: 2500
     • bot_confidence_score: 0.87
     • escalated_to_human: false
     • bot_model_version: gpt-4-turbo-2024-04-09

💾 Upserting batch 1 to Qdrant...
💾 Batch 1 upsert completed in 180ms
✅ Batch 1/15 completed successfully
📊 Overall Progress: 100/1500 points (7%)
📊 Remaining: 1400 points in ~14 batches

... (continues for all batches)

🔍 Verifying migration...
📊 Points with bot performance data: 1500
✅ Migration verification: 1500 points now have bot performance data.

🎉 Migration completed!
📊 Final results:
   - Total points found without bot data: 1500
   - Successfully processed: 1500
   - Errors: 0
```

### Error Output Example:
```
🚀 Starting add-bot-performance-data migration...
📋 Migration Details: [... environment info ...]

🔍 Checking if collection "tickets_v2" exists...
❌ Failed to get collections: Error: Request failed with status code 403

❌ MIGRATION FAILURE DETAILS:
   - Error Message: Request failed with status code 403
   - Error Type: AxiosError
   - Error Status: 403
   - Error Code: unknown
   - Migration Progress:
     • Total Records: 0
     • Processed Records: 0
     • Success Rate: 0%
     • Previous Errors: 0

🔐 PERMISSION ERROR ANALYSIS:
   - This appears to be a permissions/authentication error
   - Check Qdrant API key and permissions
   - Verify collection access rights
   - Ensure Qdrant server is accessible
```

## Safety Features

1. **Idempotent**: Can be run multiple times safely
2. **Filtered**: Only processes points without existing bot data
3. **Batched**: Processes data in small batches to avoid memory issues
4. **Error handling**: Continues processing if individual batches fail
5. **Verification**: Validates results after completion

## Troubleshooting

### "Forbidden" Error (403)
This is the most common error. It indicates a permissions/authentication issue with Qdrant:

**Root Causes:**
1. **Missing or Invalid API Key**: Check `QDRANT_API_KEY` environment variable
2. **Incorrect Qdrant URL**: Verify `QDRANT_URL` points to the correct server
3. **Network/Firewall Issues**: Ensure server can reach Qdrant
4. **Collection Permissions**: API key may not have access to `tickets_v2` collection

**Debugging Steps:**
1. Check the migration logs for environment configuration:
   ```
   🔧 Qdrant Configuration:
      - QDRANT_URL: https://your-qdrant.cloud
      - QDRANT_API_KEY: ***set*** (or not set)
   ```

2. Verify Qdrant connection manually:
   ```bash
   curl -H "api-key: YOUR_API_KEY" "https://your-qdrant.cloud/collections"
   ```

3. Test collection access:
   ```bash
   curl -H "api-key: YOUR_API_KEY" "https://your-qdrant.cloud/collections/tickets_v2"
   ```

4. Check server logs for any network/DNS issues

**Solutions:**
- Ensure `QDRANT_API_KEY` is set in your environment
- Verify the API key has read/write permissions
- Check that `QDRANT_URL` is accessible from your server
- Confirm the `tickets_v2` collection exists and is accessible

### "Unauthorized" Error (401)
Authentication failed completely:
- API key is missing, invalid, or expired
- Check API key format and regenerate if needed

### Connection/Timeout Errors
Network connectivity issues:
- Verify Qdrant server is running and accessible
- Check firewall rules and network configuration
- Ensure DNS resolution works for Qdrant URL

### Migration Already Completed
If you see "Migration already completed", the migration has already been run successfully for your organization.

### No Points Found
If no points are found, either:
- The Qdrant collection doesn't exist
- All points already have bot performance data
- The collection is empty

### Batch Failures
Individual batch failures are logged but don't stop the entire migration. Check the error messages for specific issues.

### Stuck Migration
If a migration appears stuck in "running" state, use the reset endpoint:
```bash
POST /api/v1/migrations/reset-stuck
```

## Post-Migration

After successful migration:
1. Check the Enhanced Action Plans tab in the bot performance dashboard
2. Verify insights are now populated with data
3. Review the mock performance metrics
4. Consider adjusting confidence thresholds based on the generated data

The insights dashboard should now display:
- Performance trends and patterns
- Success rate analysis
- Response time metrics
- Action breakdown charts
- Actionable recommendations

## Development Notes

- Migration uses seeded random generation for consistency
- Performance fields match the Qdrant schema in `server/src/qdrant/schemas/ticket.ts`
- Mock data is realistic but artificial - replace with real bot data as it becomes available
- The migration respects existing bot performance data and won't overwrite it