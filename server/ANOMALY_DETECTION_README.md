# Anomaly Detection System

## Overview

The Anomaly Detection System is a sophisticated real-time monitoring solution that automatically detects unusual patterns in your support ticket data. It combines statistical analysis, machine learning, and real-time monitoring to identify potential issues before they escalate.

## Features

### 🔍 **Volume Anomaly Detection**
- **Statistical Analysis**: Uses Z-score analysis to detect unusual spikes or drops in ticket volume
- **Multi-timeframe Monitoring**: Analyzes data across 1-hour, 6-hour, and 24-hour windows
- **Adaptive Thresholds**: Configurable sensitivity levels for different organizations
- **Real-time Alerts**: Immediate detection of volume changes

### 😊 **Sentiment Anomaly Detection**
- **Baseline Comparison**: Establishes normal sentiment patterns and detects deviations
- **Trend Analysis**: Identifies improving or declining customer satisfaction trends
- **Volatility Detection**: Monitors sentiment stability and detects sudden changes
- **Contextual Analysis**: Considers time-of-day and seasonal patterns

### 📊 **Advanced Statistical Methods**
- **Z-Score Analysis**: Standard statistical method for outlier detection
- **Moving Averages**: Smooths data to identify underlying trends
- **Seasonal Pattern Recognition**: Detects recurring patterns (daily, weekly, monthly)
- **Confidence Intervals**: Provides statistical confidence in anomaly detection

### 🚨 **Smart Alerting & Management**
- **Severity Classification**: Low, Medium, High, Critical severity levels
- **Confidence Scoring**: Statistical confidence in each detected anomaly
- **Workflow Management**: Acknowledge, resolve, or mark as false positive
- **Historical Tracking**: Complete audit trail of all anomalies

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Zendesk      │    │   Qdrant Vector  │    │  Anomaly       │
│   Webhook      │───▶│   Database       │───▶│  Detection     │
│                 │    │                  │    │  Service       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Statistical     │    │  MongoDB       │
                       │  Analysis        │    │  Storage       │
                       │  Engine          │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## Installation

### 1. Install Dependencies
```bash
cd server
npm install density-clustering
```

### 2. Database Schema
The system automatically creates the required MongoDB collections when you first run it.

### 3. Configuration
The system uses sensible defaults but can be customized:

```typescript
const anomalyService = new AnomalyDetectionService({
  volumeThreshold: 2.5,        // Z-score threshold for volume anomalies
  sentimentThreshold: 0.3,     // Threshold for sentiment shifts
  timeWindows: {
    short: 60 * 60 * 1000,     // 1 hour
    medium: 6 * 60 * 60 * 1000, // 6 hours
    long: 24 * 60 * 60 * 1000   // 24 hours
  },
  minDataPoints: 10            // Minimum data points for analysis
});
```

## Usage

### Automatic Detection

The system automatically runs anomaly detection as part of your insights generation job:

```typescript
// In your insights generation job
import { runAnomalyDetectionJob } from '../jobs/anomaly-detection.job';

// Run for all organizations
await runAnomalyDetectionJob();

// Run for specific organization
await runAnomalyDetectionJob('organization-id');
```

### Manual Detection

```typescript
import AnomalyDetectionService from '../services/anomaly-detection';

const anomalyService = new AnomalyDetectionService();

// Detect volume anomalies
const volumeAnomalies = await anomalyService.detectVolumeAnomalies('org-id');

// Detect sentiment anomalies
const sentimentAnomalies = await anomalyService.detectSentimentAnomalies('org-id');

// Comprehensive detection
const allAnomalies = await anomalyService.detectAllAnomalies();
```

### API Endpoints

#### Get Anomalies
```bash
GET /api/v1/anomalies?status=active&type=volume&severity=high&limit=50
```

#### Get Anomaly Statistics
```bash
GET /api/v1/anomalies/stats?hours=24
```

#### Acknowledge Anomaly
```bash
POST /api/v1/anomalies/{id}/acknowledge
{
  "notes": "Investigating this issue"
}
```

#### Resolve Anomaly
```bash
POST /api/v1/anomalies/{id}/resolve
{
  "notes": "Issue resolved by implementing fix"
}
```

#### Mark as False Positive
```bash
POST /api/v1/anomalies/{id}/false-positive
{
  "notes": "This was a false alarm"
}
```

#### Manual Detection Trigger
```bash
POST /api/v1/anomalies/detect
```

## Configuration

### Environment Variables

```bash
# Anomaly Detection Settings
ANOMALY_VOLUME_THRESHOLD=2.5
ANOMALY_SENTIMENT_THRESHOLD=0.3
ANOMALY_MIN_DATA_POINTS=10
ANOMALY_CLEANUP_DAYS=7
```

### Custom Thresholds

```typescript
// Organization-specific thresholds
const orgConfig = {
  volumeThreshold: 2.0,      // More sensitive for this org
  sentimentThreshold: 0.2,   // More sensitive for this org
  timeWindows: {
    short: 30 * 60 * 1000,   // 30 minutes
    medium: 3 * 60 * 60 * 1000, // 3 hours
    long: 12 * 60 * 60 * 1000    // 12 hours
  }
};

const anomalyService = new AnomalyDetectionService(orgConfig);
```

## Monitoring & Alerting

### Real-time Monitoring

The system provides real-time monitoring capabilities:

```typescript
// Get current anomaly status
const stats = await getAnomalyStats();
console.log(`Active anomalies: ${stats.totalActive}`);
console.log(`Critical: ${stats.bySeverity.critical || 0}`);
console.log(`High: ${stats.bySeverity.high || 0}`);
```

### Integration with Existing Systems

```typescript
// Integrate with your existing alerting system
import { executeAutonomousActions } from '../services/autonomousAI';

// When critical anomalies are detected
if (anomaly.severity === 'critical') {
  await executeAutonomousActions(
    'system',
    anomaly.organizationId,
    'escalate',
    0.9
  );
}
```

## Testing

### Run Test Script

```bash
cd server
npx ts-node src/scripts/test-anomaly-detection.ts
```

### Test Individual Components

```typescript
import { calculateZScore, detectSeasonalPatterns } from '../services/anomaly-detection/statistical-methods';

// Test Z-score calculation
const zScore = calculateZScore(25, 20, 5); // Should return 1.0

// Test seasonal pattern detection
const patterns = detectSeasonalPatterns([/* your data */]);
```

## Performance Considerations

### Data Volume
- **Small Organizations** (< 100 tickets/day): Real-time detection
- **Medium Organizations** (100-1000 tickets/day): Hourly detection
- **Large Organizations** (> 1000 tickets/day): Batch processing with configurable intervals

### Memory Usage
- **Vector Storage**: 768-dimensional vectors stored in Qdrant
- **Statistical Calculations**: In-memory processing with configurable batch sizes
- **Database Storage**: MongoDB with automatic cleanup of old anomalies

### Scalability
- **Horizontal Scaling**: Each organization processed independently
- **Background Processing**: Non-blocking anomaly detection
- **Configurable Intervals**: Adjust detection frequency based on needs

## Troubleshooting

### Common Issues

#### 1. No Anomalies Detected
```typescript
// Check data availability
const recentVectors = await qdrantService.getRecentVectors({
  organizationId: 'your-org-id',
  createdAfter: new Date(Date.now() - 24 * 60 * 60 * 1000),
  limit: 100
});

console.log(`Available vectors: ${recentVectors.length}`);
```

#### 2. Too Many False Positives
```typescript
// Increase thresholds
const service = new AnomalyDetectionService({
  volumeThreshold: 3.0,      // More strict
  sentimentThreshold: 0.5    // More strict
});
```

#### 3. Performance Issues
```typescript
// Reduce data points
const service = new AnomalyDetectionService({
  minDataPoints: 20,         // Require more data
  timeWindows: {
    short: 2 * 60 * 60 * 1000,   // 2 hours instead of 1
    medium: 12 * 60 * 60 * 1000, // 12 hours instead of 6
    long: 48 * 60 * 60 * 1000    // 48 hours instead of 24
  }
});
```

### Debug Mode

```typescript
// Enable detailed logging
const service = new AnomalyDetectionService({
  debug: true,
  logLevel: 'verbose'
});
```

## Future Enhancements

### Planned Features
- **Machine Learning Models**: Advanced ML-based anomaly detection
- **Predictive Analytics**: Forecast potential issues before they occur
- **Integration APIs**: Webhook notifications for external systems
- **Custom Metrics**: Support for organization-specific KPIs
- **Advanced Visualization**: Real-time dashboards and reporting

### Contributing
The anomaly detection system is designed to be extensible. You can:
- Add new statistical methods
- Implement custom anomaly types
- Create organization-specific detection rules
- Integrate with external monitoring systems

## Support

For questions or issues:
1. Check the logs for detailed error messages
2. Run the test script to verify system functionality
3. Review configuration settings
4. Check data availability in Qdrant
5. Verify MongoDB connectivity and permissions

---

**Note**: This system is designed to work alongside your existing insights generation and provides an additional layer of real-time monitoring for your support operations.
