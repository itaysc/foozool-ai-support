# Zendesk Rate Limiting Fix

## Problem
The application was experiencing HTTP 429 (Too Many Requests) errors from Zendesk due to:
1. **Parallel API calls**: Using `Promise.all()` to make multiple Zendesk API calls simultaneously
2. **No rate limiting**: No delays between API calls
3. **No retry logic**: Failed requests due to rate limiting were not retried

## Solution Implemented

### 1. Rate Limiting Utility Functions
Added three utility functions in both `server/src/services/zendesk/index.ts` and `server/src/tools/zendesk/index.ts`:

- **`delay(ms)`**: Simple delay function
- **`retryWithBackoff(fn, maxRetries, baseDelay)`**: Retries failed requests with exponential backoff
- **`rateLimitedApiCall(apiCall, delayMs)`**: Wraps API calls with rate limiting and retry logic

### 2. Sequential Processing
Changed from parallel execution (`Promise.all()`) to sequential processing:
- **Before**: All API calls made simultaneously → Rate limiting
- **After**: API calls made one by one with delays → No rate limiting

### 3. Configurable Rate Limiting
Added environment variables to control rate limiting behavior:

```bash
# Zendesk Rate Limiting Configuration
ZENDESK_RATE_LIMIT_DELAY_MS=100    # Delay between API calls (ms)
ZENDESK_MAX_RETRIES=3              # Maximum retry attempts
ZENDESK_RETRY_BASE_DELAY_MS=1000   # Base delay for exponential backoff (ms)
```

## Files Modified

1. **`server/src/services/zendesk/index.ts`**
   - Fixed `fetchTicketsByExternalIds()` function
   - Added rate limiting utilities

2. **`server/src/tools/zendesk/index.ts`**
   - Fixed `fetch_multiple_tickets_by_id()` function
   - Added rate limiting utilities

3. **`server/src/config.ts`**
   - Added rate limiting configuration options

4. **`railway.env.template`**
   - Added rate limiting environment variables

## How It Works

### Before (Problematic)
```typescript
// All calls made simultaneously
const results = await Promise.all(
  ids.map(async (id) => {
    return await api.get(`/search.json?query=external_id:${id}`);
  })
);
```

### After (Fixed)
```typescript
// Calls made sequentially with delays
for (const id of ids) {
  const response = await rateLimitedApiCall(async () => 
    api.get(`/search.json?query=external_id:${id}`)
  );
  // 100ms delay automatically added between calls
}
```

## Benefits

1. **No more 429 errors**: Proper rate limiting prevents hitting Zendesk limits
2. **Automatic retries**: Failed requests are automatically retried with exponential backoff
3. **Configurable**: Rate limiting behavior can be adjusted via environment variables
4. **Resilient**: System continues working even when individual requests fail
5. **Better logging**: Clear logging when rate limiting occurs

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `ZENDESK_RATE_LIMIT_DELAY_MS` | 100ms | Delay between API calls |
| `ZENDESK_MAX_RETRIES` | 3 | Maximum retry attempts for failed requests |
| `ZENDESK_RETRY_BASE_DELAY_MS` | 1000ms | Base delay for exponential backoff |

## Testing

To test the fix:
1. Set the environment variables in your Railway project
2. Restart the server
3. Monitor logs for rate limiting messages
4. Verify that 429 errors no longer occur

## Monitoring

The system now logs rate limiting events:
```
Rate limited (429). Waiting 1000ms before retry 1/3
Rate limited (429). Waiting 2000ms before retry 2/3
```

This provides visibility into when rate limiting occurs and how the system handles it. 