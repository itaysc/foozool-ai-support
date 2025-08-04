# News Monitoring System

This document describes the news monitoring system that has been implemented to provide organizations with relevant news and actionable insights.

## Overview

The news monitoring system automatically fetches Google News RSS feeds based on organization details, analyzes the relevance and impact of news items, and generates actionable insights for organizations.

## Features

### Server-Side Features

1. **News Service** (`server/src/services/news/index.ts`)
   - Fetches Google News RSS feeds based on organization details, country, and regions
   - Analyzes news relevance and impact using Mistral LLM (Together AI)
   - Generates industry-specific keywords dynamically using LLM based on organization details
   - Summarizes relevant news using the existing Python ML service
   - Generates actionable insights and recommendations

2. **Daily News Monitoring Job** (`server/src/jobs/news-monitoring.job.ts`)
   - Runs once daily at 8 AM (configurable via `NEWS_MONITORING_CRON`)
   - Processes news for all organizations in the system
   - Caches results in Redis for 4 hours

3. **News API Routes** (`server/src/routes/news/v1/index.ts`)
   - `GET /api/v1/news/:organizationId` - Get raw news
   - `GET /api/v1/news/:organizationId/action-items` - Get action items
   - `GET /api/v1/news/:organizationId/summary` - Get news summary
   - `GET /api/v1/news/:organizationId/full` - Get complete news data

### Client-Side Features

1. **News Service** (`client/src/services/news-service.tsx`)
   - API client for fetching news data
   - Handles authentication and error handling

2. **News Store** (`client/src/stores/news.store.tsx`)
   - MobX store for managing news state
   - Implements client-side caching (4 hours)
   - Provides computed properties for filtered data

3. **News Section Component** (`client/src/components/news/NewsSection.tsx`)
   - Displays action items with priority levels
   - Shows news summary and relevant articles
   - Provides refresh functionality
   - Responsive design with Material-UI

4. **Dashboard Integration**
   - News section integrated into the main dashboard
   - Automatically loads based on user's organization

## Configuration

### Environment Variables

Add the following to your environment configuration:

```bash
# News monitoring cron schedule (default: daily at 8 AM)
NEWS_MONITORING_CRON=0 8 * * *

# Redis connection for caching
REDIS_CONNECTION_STRING=redis://localhost:6379
```

### Organization Schema

The system uses the following organization fields:
- `details`: Business description (e.g., "electronic store", "toy store")
- `country`: Organization's country
- `regions`: Array of regions (EMEA, APAC, LATAM, etc.)

## How It Works

1. **RSS Feed Generation**: The system creates Google News RSS URLs based on:
   - Organization details/business type
   - Country and regions
   - Industry-specific keywords (generated dynamically by LLM)
   - General business impact keywords

2. **News Analysis**: Each news item is analyzed for:
   - Relevance (high/medium/low)
   - Impact (positive/negative/neutral)
   - Categories (supply_chain, market_research, etc.)

3. **Action Item Generation**: The LLM generates actionable insights including:
   - Priority levels (high/medium/low)
   - Suggested actions
   - Impact descriptions

4. **Caching**: Results are cached in Redis for 4 hours to improve performance

## API Endpoints

### Get Raw News
```http
GET /api/v1/news/:organizationId
Authorization: Bearer <token>
```

**Note**: All news endpoints require authentication and use the user context system. The user ID and organization ID are automatically extracted from the JWT token context, eliminating the need for prop drilling.

### Get Action Items
```http
GET /api/v1/news/:organizationId/action-items
Authorization: Bearer <token>
```

### Get News Summary
```http
GET /api/v1/news/:organizationId/summary
Authorization: Bearer <token>
```

### Get Complete News Data
```http
GET /api/v1/news/:organizationId/full
Authorization: Bearer <token>
```

## Data Models

### NewsItem
```typescript
interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  source: string;
}
```

### ProcessedNewsItem
```typescript
interface ProcessedNewsItem extends NewsItem {
  relevance: 'high' | 'medium' | 'low';
  impact: 'positive' | 'negative' | 'neutral';
  categories: string[];
}
```

### ActionItem
```typescript
interface ActionItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  impact: string;
  suggestedActions: string[];
}
```

## Industry Keywords

The system automatically adds industry-specific keywords based on organization details:

- **Electronics/Technology**: semiconductor, chip shortage, electronics supply
- **Automotive**: automotive industry, car manufacturing, vehicle supply
- **Food/Beverage**: food supply, agriculture, commodity prices
- **Retail**: retail industry, consumer spending, e-commerce
- **Manufacturing**: manufacturing, industrial production, factory output
- **Healthcare**: healthcare industry, medical supplies, pharmaceutical
- **Finance**: financial markets, banking, investment

## Monitoring and Maintenance

1. **Job Monitoring**: The news monitoring job logs its progress and any errors
2. **Cache Management**: Redis cache automatically expires after 4 hours
3. **Error Handling**: Comprehensive error handling with fallbacks
4. **Rate Limiting**: Built-in delays to avoid overwhelming external APIs

## Future Enhancements

1. **Custom Keywords**: Allow organizations to specify custom keywords
2. **News Alerts**: Real-time notifications for high-priority news
3. **Historical Analysis**: Track news trends over time
4. **Competitor Monitoring**: Include competitor-specific news
5. **Sentiment Analysis**: Enhanced sentiment analysis for news items

## Troubleshooting

### Common Issues

1. **No News Data**: Check if the organization has valid details, country, and regions
2. **RSS Feed Errors**: Verify internet connectivity and Google News availability
3. **LLM Analysis Failures**: Check OpenAI API key and rate limits
4. **Cache Issues**: Verify Redis connection and configuration

### Logs

Monitor the following log messages:
- `🔄 Starting daily news monitoring job...`
- `📰 Processing news for organization: <name>`
- `✅ Processed news for <name>: <stats>`
- `❌ Error processing news for organization <name>: <error>` 