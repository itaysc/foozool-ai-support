# Insights System

The Insights System automatically analyzes incoming support tickets to detect patterns, issues, and opportunities for improvement. It uses machine learning to identify recurring problems and generate actionable insights for your support team.

## Overview

When tickets are processed through the webhook, the system:

1. **Collects ticket data** - Gathers recent tickets (last 30 days) for analysis
2. **Performs ML analysis** - Uses Python ML service to detect patterns using NLP techniques
3. **Generates insights** - Creates or updates insights based on detected patterns
4. **Stores insights** - Saves insights to MongoDB for later review and action

## Types of Insights Detected

### Product Complaints
- **What**: Multiple complaints about the same product with similar patterns
- **Why useful**: Identifies quality issues that need investigation
- **Action**: Review product quality, contact affected customers

### Information Gaps
- **What**: Customers repeatedly asking for similar information
- **Why useful**: Indicates missing or unclear documentation
- **Action**: Update documentation, create FAQ entries

### Bug Patterns
- **What**: Multiple reports of similar technical issues
- **Why useful**: Identifies systematic problems affecting multiple customers
- **Action**: Prioritize bug fixes, investigate root causes

### Feature Requests
- **What**: Common requests for new features or improvements
- **Why useful**: Helps prioritize product roadmap based on customer demand
- **Action**: Review for product roadmap inclusion

## Architecture

```
Ticket Webhook → Node.js Service → Python ML Service → Analysis Results → Insight Storage
     ↓                ↓                    ↓                  ↓              ↓
   Zendesk     InsightsService    insight_analysis.py    Pattern Detection   MongoDB
```

### Components

1. **Node.js Insights Service** (`server/src/services/insights/index.ts`)
   - Orchestrates insight processing
   - Manages insight lifecycle (create/update)
   - Provides API for retrieving insights

2. **Python ML Service** (`python-ml-service/services/insight_analysis.py`)
   - Performs pattern detection using NLP
   - Uses TF-IDF, clustering, and keyword extraction
   - Returns structured insight data

3. **MongoDB Schema** (`server/src/schemas/insight.schema.ts`)
   - Stores insights with metadata
   - Tracks frequency, confidence, trends
   - Links to related tickets

## Usage

### Automatic Processing

The system automatically processes new tickets when they come through the webhook:

```typescript
// In webhook.ts - automatically called
processTicketInsights(ticketId, ticketPayload, product, organizationId);
```

### Retrieving Insights

```typescript
import { insightsService } from '../insights';

// Get all insights
const { insights, total } = await insightsService.getInsights();

// Get filtered insights
const filtered = await insightsService.getInsights({
  organization: 'org123',
  severity: InsightSeverity.HIGH,
  status: InsightStatus.ACTIVE,
  limit: 20
});
```

### Updating Insight Status

```typescript
// Mark insight as being investigated
await insightsService.updateInsightStatus(
  insightId, 
  InsightStatus.INVESTIGATING,
  {
    type: 'investigation_started',
    description: 'Started investigating product quality issues',
    performedBy: 'user123'
  }
);
```

## Best Practices

1. **Regular review** - Check insights dashboard regularly
2. **Action tracking** - Update insight status when taking action
3. **Threshold tuning** - Adjust ML thresholds based on false positive rates
4. **Data quality** - Ensure ticket data is clean and consistent 