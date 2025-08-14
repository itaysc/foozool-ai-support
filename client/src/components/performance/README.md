# Performance Components

This directory contains reusable components for the AI Performance & System Reliability page.

## Components

### MetricCard
A reusable card component for displaying performance metrics with:
- Title
- Value (large, prominent display)
- Optional subtitle
- Optional icon
- Customizable color

### AccuracyChart
A bar chart component using Recharts to display confidence vs. accuracy analysis:
- Shows accuracy percentages for different confidence levels
- Responsive design
- Customizable title

### PerformanceSummary
A summary component showing system reliability metrics:
- Overall prediction accuracy
- Escalation risk prediction accuracy
- CSAT risk prediction accuracy
- Progress bars with color coding
- Total predictions evaluated

## Usage

```tsx
import { MetricCard, AccuracyChart, PerformanceSummary } from '@/components';

// Example usage
<MetricCard
  title="Overall Accuracy"
  value="85.2%"
  subtitle="150 tickets evaluated"
  color="primary.main"
  icon={<VerifiedUser />}
/>
```

## Features

- **System Reliability**: Shows how often predictions are correct
- **Confidence vs. Accuracy**: Helps understand which predictions are most trustworthy
- **Key Performance Indicators**: Clear metrics for escalation and CSAT prediction accuracy
- **Visual Insights**: Charts and progress bars for easy understanding
- **Responsive Design**: Works on all screen sizes
- **Reusable Components**: Modular design for easy maintenance
