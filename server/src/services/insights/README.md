# Insights System Documentation

## Overview

The Insights System provides comprehensive analytics and AI-powered insights for your autonomous support bot. It leverages your existing Qdrant vector storage to generate actionable business intelligence without requiring database schema changes.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Zendesk      │    │   Qdrant         │    │   MongoDB       │
│   Webhooks     │───▶│   Vector Store   │───▶│   Insights      │
│                │    │                  │    │   Storage       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Analytics      │
                       │   Engine         │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   AI Insights    │
                       │   Generator      │
                       └──────────────────┘
```

## Core Components

### 1. QdrantAnalyticsService
Extracts analytics from Qdrant vector data and generates insights.

**Key Features:**
- Extracts ticket metadata from Qdrant
- Calculates sentiment distribution
- Analyzes intent patterns
- Detects trends and anomalies
- Generates AI-powered insights

### 2. DashboardService
Provides real-time dashboard metrics and insights.

**Key Features:**
- Real-time metrics calculation
- AI-powered insight generation
- Alert and notification system
- Performance comparison analysis

### 3. InsightsScheduler
Manages scheduled jobs using node-cron.

**Scheduled Jobs:**
- **Daily Analytics**: Every day at 6 AM UTC
- **Weekly Insights**: Every Sunday at 2 AM UTC  
- **Monthly Cleanup**: First day of month at 3 AM UTC

## API Endpoints

### Analytics
```bash
GET /api/v1/insights/analytics?startDate=2024-01-01&endDate=2024-01-31
```

### Generate Insights
```bash
POST /api/v1/insights/generate
{
  "timeRange": { "start": "2024-01-01", "end": "2024-01-31" },
  "includeTrends": true,
  "includeAnomalies": true,
  "includeTopIssues": true
}
```

### Dashboard
```bash
GET /api/v1/insights/dashboard/metrics
GET /api/v1/insights/dashboard/insights
GET /api/v1/insights/dashboard/alerts
GET /api/v1/insights/dashboard/performance
```

### Insights Management
```bash
GET /api/v1/insights?category=trend&severity=high&limit=50
GET /api/v1/insights/:id
PATCH /api/v1/insights/:id/status
GET /api/v1/insights/summary
GET /api/v1/insights/trends
```

### Scheduler Management
```bash
GET /api/v1/insights/scheduler/status
POST /api/v1/insights/scheduler/trigger/:jobName
POST /api/v1/insights/scheduler/start
POST /api/v1/insights/scheduler/stop
PUT /api/v1/insights/scheduler/job/:jobName
```

## Data Flow

### 1. Ticket Processing
1. Zendesk webhook receives ticket
2. Ticket is analyzed and vectorized
3. Vector and metadata stored in Qdrant
4. Real-time analytics updated

### 2. Insights Generation
1. QdrantAnalyticsService extracts data
2. Calculates metrics and trends
3. AI generates actionable insights
4. Insights stored in MongoDB

### 3. Dashboard Updates
1. DashboardService aggregates data
2. Real-time metrics calculated
3. Alerts generated for anomalies
4. Performance comparisons updated

## Configuration

### Job Scheduling
Jobs are configured in `server/src/jobs/insights/insights-scheduler.ts`:

```typescript
{
  name: 'daily-analytics',
  cronPattern: '0 6 * * *', // Every day at 6 AM
  description: 'Generate daily analytics and insights',
  enabled: true
}
```

### Timezone
All jobs run in UTC timezone by default. Can be configured in scheduler.

## Monitoring

### Job Status
Check job status via API:
```bash
GET /api/v1/insights/scheduler/status
```

### Manual Triggers
Trigger jobs manually:
```bash
POST /api/v1/insights/scheduler/trigger/daily-analytics
POST /api/v1/insights/scheduler/trigger/weekly-insights
POST /api/v1/insights/scheduler/trigger/monthly-cleanup
```

### Logs
Monitor job execution in server logs:
```
🔄 Starting job: daily-analytics - Generate daily analytics and insights
✅ Daily analytics completed: 15 insights generated for 3/3 organizations
```

## Insights Categories

### 1. Product Feedback
- Feature requests
- Bug reports
- User experience issues
- Product improvement suggestions

### 2. Customer Satisfaction
- Sentiment analysis
- Satisfaction trends
- Negative feedback patterns
- Improvement opportunities

### 3. Support Trends
- Volume patterns
- Common issues
- Resolution times
- Agent performance

### 4. Anomalies
- Volume spikes
- Sentiment shifts
- New issue patterns
- Unusual activity

## Best Practices

### 1. Monitoring
- Check job status regularly
- Monitor error logs
- Review generated insights
- Track performance metrics

### 2. Configuration
- Adjust cron schedules based on business needs
- Configure timezone appropriately
- Set up alerts for job failures
- Monitor resource usage

### 3. Data Quality
- Ensure Qdrant data is up-to-date
- Validate insight accuracy
- Review and archive old insights
- Monitor AI-generated content

### 4. Performance
- Monitor job execution times
- Optimize database queries
- Scale based on data volume
- Cache frequently accessed data

## Troubleshooting

### Common Issues

1. **Jobs not running**
   - Check scheduler status
   - Verify cron patterns
   - Check timezone settings
   - Review server logs

2. **No insights generated**
   - Verify Qdrant data exists
   - Check organization filters
   - Review analytics service logs
   - Validate AI service connectivity

3. **High resource usage**
   - Optimize batch sizes
   - Review job frequency
   - Monitor memory usage
   - Scale infrastructure

### Debug Commands

```bash
# Check scheduler status
curl -X GET /api/v1/insights/scheduler/status

# Trigger manual job
curl -X POST /api/v1/insights/scheduler/trigger/daily-analytics

# Check recent insights
curl -X GET /api/v1/insights?limit=10

# Get analytics for organization
curl -X GET /api/v1/insights/analytics
```

## Future Enhancements

1. **Advanced Analytics**
   - Predictive modeling
   - Customer segmentation
   - Churn prediction
   - Revenue impact analysis

2. **Enhanced AI**
   - Custom insight categories
   - Industry-specific analysis
   - Multi-language support
   - Context-aware recommendations

3. **Real-time Features**
   - Live dashboards
   - WebSocket notifications
   - Real-time alerts
   - Instant insight generation

4. **Integration**
   - Slack notifications
   - Email reports
   - BI tool integration
   - Custom webhooks 