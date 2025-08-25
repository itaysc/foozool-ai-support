# Anomalies Page

## Overview
The Anomalies page displays real-time anomaly detection results from the backend system. It shows unusual patterns in ticket volume and customer sentiment that may indicate emerging issues.

## Features

### 📊 Dashboard Stats
- **Active Anomalies**: Total number of unresolved anomalies
- **Recent Activity**: Anomalies detected in the selected time window
- **High/Critical**: Count of high and critical severity anomalies
- **Volume Anomalies**: Count of volume-related anomalies

### 🔍 Filtering & Search
- **Status**: Filter by anomaly status (Active, Acknowledged, Resolved, False Positive)
- **Type**: Filter by anomaly type (Volume, Sentiment)
- **Severity**: Filter by severity level (Low, Medium, High, Critical)
- **Time Window**: Filter by detection time (24h, 48h, 7 days, All time)

### 🎯 Anomaly Management
- **Acknowledge**: Mark anomalies as being investigated
- **Resolve**: Mark anomalies as fixed or no longer relevant
- **False Positive**: Mark anomalies as incorrectly flagged
- **Notes**: Add context and explanations for actions

### 🚀 Manual Detection
- **Trigger Detection**: Manually run anomaly detection for immediate results
- **Real-time Updates**: Automatic refresh after detection completes

## Anomaly Types

### Volume Anomalies
- **Detection**: Statistical analysis of ticket volume patterns
- **Triggers**: Unusual spikes or drops in ticket creation
- **Metrics**: Current vs. expected volume, Z-score, confidence

### Sentiment Anomalies
- **Detection**: Analysis of customer sentiment trends
- **Triggers**: Significant changes in customer satisfaction
- **Metrics**: Sentiment shifts, volatility changes, baseline comparisons

## Anomaly Lifecycle

1. **Active** 🔴 - Newly detected, requires attention
2. **Acknowledged** 🟡 - Under investigation
3. **Resolved** 🟢 - Issue fixed or anomaly addressed
4. **False Positive** ⚪ - Incorrectly flagged, no action needed

## Usage

### Viewing Anomalies
1. Navigate to the Anomalies page
2. Use filters to focus on specific types or time periods
3. Review anomaly details and severity levels

### Managing Anomalies
1. **Acknowledge** anomalies you're investigating
2. **Resolve** anomalies when issues are fixed
3. **Mark as False Positive** for incorrectly flagged items
4. Add notes to provide context for your team

### Triggering Detection
1. Click "Trigger Detection" for immediate analysis
2. Wait for the process to complete (usually 5-10 seconds)
3. Review new anomalies that are detected

## Technical Details

### API Integration
- Uses the `/api/v1/anomalies` endpoints
- Real-time data fetching with automatic refresh
- Pagination for large datasets
- Optimistic UI updates for better UX

### State Management
- Local state for filters and pagination
- Automatic data refresh on filter changes
- Error handling with user-friendly messages
- Loading states for better perceived performance

### Responsive Design
- Mobile-friendly layout
- Adaptive grid system
- Touch-friendly controls
- Responsive typography

## Dependencies
- Material-UI components
- React hooks for state management
- Custom anomalies service
- TypeScript for type safety
