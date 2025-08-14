# Resolution Time Data Migration

This migration populates Qdrant tickets with mock resolution time prediction data to demonstrate the new features in the UI.

## What It Does

The migration will:
1. Fetch up to 2000 tickets from the Qdrant `tickets_v2` collection
2. Add realistic mock data for the new fields:
   - `resolution_time_ms`: Time to resolution in milliseconds
   - `resolved_at`: Timestamp when ticket was resolved
   - `long_resolution_predicted`: Whether long resolution was predicted
   - `prediction_confidence`: Confidence score for the prediction
   - `prediction_added_at`: When the prediction was made

## Data Quality

The mock data is designed to show **good prediction accuracy**:
- **70% of tickets** have resolution data (simulating resolved tickets)
- **80% of long resolution tickets** (>24 hours) were correctly predicted
- **90% of short resolution tickets** were correctly NOT predicted as long
- **Realistic resolution times** between 2 hours and 7 days
- **High confidence scores** (70-100%) for correct predictions

## Running the Migration

### Option 1: Using the Script (Recommended)

```bash
# Navigate to the server directory
cd server

# Make the script executable
chmod +x scripts/run-resolution-time-migration.js

# Run the migration
node scripts/run-resolution-time-migration.js
```

### Option 2: Using the Migration Service

```bash
# Navigate to the server directory
cd server

# Build the project first
npm run build

# Run the migration via the migration service
npm run migrate:run add-resolution-time-data-to-qdrant
```

### Option 3: Via API Endpoint

If you have the migration API running:

```bash
curl -X POST http://localhost:3000/api/v1/migrations/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"migrationName": "add-resolution-time-data-to-qdrant"}'
```

## Expected Output

```
🚀 Starting Resolution Time Data Migration...
📊 Fetching tickets from Qdrant collection: tickets_v2
📦 Fetched 1000 tickets so far...
📦 Fetched 2000 tickets so far...
📊 Found 2000 tickets to update with resolution time data
📦 Processing batch 1/40
✅ Batch completed: 45 updated, 5 created, 0 skipped
📦 Processing batch 2/40
✅ Batch completed: 48 updated, 2 created, 0 skipped
...
🎯 Migration completed: 1800 updated, 200 created, 0 skipped
✅ Migration completed successfully!
📈 2000 tickets now have resolution time prediction data
🌐 You can now view the enhanced performance metrics in the UI
```

## Verification

After running the migration, you can verify the data by:

1. **Check Qdrant**: Query some tickets to see the new fields
2. **Check the UI**: Visit the performance page to see the new metrics
3. **Check API**: Call the predictions endpoints to see enhanced data

## Rollback

If you need to remove the mock data, you can create a rollback migration or manually clear the fields:

```typescript
// Example rollback logic
const clearFields = {
  resolution_time_ms: null,
  resolved_at: null,
  long_resolution_predicted: null,
  prediction_confidence: null,
  prediction_added_at: null
};
```

## Troubleshooting

### Common Issues

1. **"No tickets found"**: Ensure Qdrant has tickets in the `tickets_v2` collection
2. **"Migration failed"**: Check Qdrant connection and permissions
3. **"Batch failed"**: Reduce batch size in the migration code
4. **"Point not found"**: The migration will attempt to create new points for missing ones

### Performance Tips

- The migration processes tickets in batches of 50 to avoid memory issues
- There's a 200ms delay between batches to avoid overwhelming Qdrant
- Monitor Qdrant performance during the migration
- The migration handles missing points by creating new ones with mock data

## Data Distribution

The mock data creates a realistic distribution:

- **Short resolution** (<24 hours): ~60% of tickets
- **Long resolution** (>24 hours): ~10% of tickets  
- **Still open**: ~30% of tickets
- **Prediction accuracy**: ~85% overall

## Error Handling

The migration includes robust error handling:
- **Missing points**: Automatically creates new points with mock data
- **Update failures**: Logs errors and continues with other tickets
- **Batch processing**: Continues even if individual tickets fail
- **Detailed reporting**: Shows counts of updated, created, and skipped tickets

This provides a good foundation for testing and demonstrating the new resolution time prediction features in the UI.
