# 🔮 Prediction Migration Guide

## Overview
The `CreatePredictionsFromZendeskTicketsMigration` fetches existing Zendesk tickets and generates risk predictions using the same logic as the webhook handler.

## What It Does
1. **Fetches** ~1,200 recent tickets from Zendesk (12 pages) in memory-efficient chunks
2. **Batch processes** SBERT embeddings for optimal performance
3. **Analyzes** each ticket using:
   - Sentiment analysis
   - Pre-computed SBERT embeddings 
   - KNN search for similar tickets
4. **Generates** escalation and CSAT risk predictions
5. **Saves** predictions to MongoDB with automatic memory cleanup

## API Routes Available

### Run This Specific Migration
```bash
POST /api/v1/migrations/run/create-predictions-from-zendesk-tickets
```

### List All Available Migrations
```bash
GET /api/v1/migrations/status
```

### Run All Migrations
```bash
POST /api/v1/migrations/run-all
```

## Postman Usage

1. **Set Authorization**: Use your JWT token
2. **POST Request** to: `{{nodejs_base_url}}/api/v1/migrations/run/create-predictions-from-zendesk-tickets`
3. **Empty Body** (no payload needed)

## Expected Output
- Processes tickets in optimized bulks of 50
- Fetches Zendesk pages individually to minimize memory usage
- Batch generates SBERT embeddings for up to 50 tickets at once
- Automatic memory cleanup with garbage collection hints
- Shows success rate at completion
- Creates predictions in MongoDB

## Sample Response
```json
{
  "success": true,
  "message": "Migration create-predictions-from-zendesk-tickets completed successfully",
  "migration": {
    "name": "create-predictions-from-zendesk-tickets",
    "description": "Fetch existing Zendesk tickets and create risk predictions using KNN analysis",
    "version": "1.0.0",
    "status": "completed"
  },
  "result": {
    "success": true,
    "totalRecords": 1200,
    "processedRecords": 1150,
    "errors": [],
    "metadata": {
      "organizationId": "...",
      "organizationName": "Demo Organization",
      "totalPages": 12,
      "successRate": "96%"
    },
    "executionTime": 120000
  }
}
```

## After Migration
Once complete, refresh your insights page to see the predictions:
- 🔮 Real-Time Risk Predictions section will show data
- 📊 Recent Risk Predictions cards will display individual ticket risks

## Troubleshooting
- **No Zendesk tickets**: Ensure Zendesk integration is configured
- **No similar tickets**: KNN search needs existing data in Qdrant
- **High error rate**: Check Zendesk API limits and connectivity