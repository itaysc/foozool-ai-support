# Running the Bot Performance Migration

## Quick Start

### 1. Check Migration Status
First, check what migrations are available and their status:

```bash
curl -X GET "http://localhost:3001/api/v1/migrations/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Run the Bot Performance Migration
Run the specific migration to add bot performance data:

```bash
curl -X POST "http://localhost:3001/api/v1/migrations/run/add-bot-performance-data" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Check Migration History
After running, check the migration history:

```bash
curl -X GET "http://localhost:3001/api/v1/migrations/history" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Alternative: Run All Migrations

If you want to run all available migrations:

```bash
curl -X POST "http://localhost:3001/api/v1/migrations/run-all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Expected Response

### Successful Migration Response:
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "data": {
    "migration": {
      "name": "add-bot-performance-data",
      "description": "Add mock bot performance data to existing Qdrant ticket points for insights dashboard",
      "status": "completed",
      "startedAt": "2024-01-15T10:30:00.000Z",
      "completedAt": "2024-01-15T10:32:15.000Z"
    },
    "result": {
      "name": "add-bot-performance-data",
      "databaseType": "qdrant",
      "result": {
        "success": true,
        "totalRecords": 1500,
        "processedRecords": 1500,
        "errors": [],
        "executionTime": 135000
      },
      "startedAt": "2024-01-15T10:30:00.000Z",
      "completedAt": "2024-01-15T10:32:15.000Z"
    }
  }
}
```

### Already Completed Response:
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "data": {
    "result": {
      "result": {
        "success": true,
        "errors": [],
        "metadata": {
          "message": "Migration already completed"
        }
      }
    }
  }
}
```

## What Happens During Migration

1. **Validation**: Checks if Qdrant collection exists
2. **Counting**: Counts points without bot performance data
3. **Processing**: Updates points in batches of 100
4. **Verification**: Verifies the migration completed successfully
5. **Logging**: Provides detailed progress logs

## After Migration

Once completed, your Enhanced Action Plans tab in the bot performance dashboard will show:

- **Performance insights** with success rate analysis
- **Escalation patterns** and recommendations  
- **Response time optimization** suggestions
- **Cost savings opportunities**
- **Quality improvement** action plans
- **Automation expansion** recommendations

## Troubleshooting

### Migration Stuck
If migration appears stuck, reset it:
```bash
curl -X POST "http://localhost:3001/api/v1/migrations/reset-stuck" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### No Data After Migration
1. Check that the migration completed successfully
2. Refresh the bot performance dashboard
3. Verify you're looking at the "Enhanced Action Plans" tab
4. Check that your time range includes recent data

### Authentication Issues
Make sure you're using a valid JWT token with proper organization access.

## Development Testing

For development/testing, you can run the registration test:
```bash
cd server
npx ts-node src/scripts/test-migration-registration.ts
```

This will verify that the migration is properly registered and available.