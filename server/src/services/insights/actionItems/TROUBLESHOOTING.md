# Action Items Troubleshooting

## Problem: No Action Items Created

### Issue
Action items are not appearing in the database after running the insights job.

### Solution
Action items are now automatically created for:
1. **New ticket cluster insights** - Handled in `insights-generator.job.ts` ✅
2. **New Customer Success insights** - Fixed in `customer-success/main.service.ts` ✅
3. **New stakeholder insights** - Fixed in `customer-success/main.service.ts` ✅

### What Changed
Updated `persistCustomerSuccessInsights()` and `persistStakeholderInsights()` to:
1. Check if an insight already exists before upsert
2. Create action items only for NEW insights (not updates)
3. Log success/failure of action item creation

### Testing
Run the insights job again:
```bash
npm run generate-insights
```

Or manually trigger:
```typescript
import { generateInsightsJob } from './jobs/insights-generator.job';

await generateInsightsJob(organizationId, userId);
```

Check logs for:
```
[CS Insights] ✅ Created action items for new insight: <insightId>
```

## Debug Checklist

1. **Check if insights are being created**
   ```javascript
   db.insights.find({ organizationId: 'your-org-id' }).count()
   ```

2. **Check if action items exist**
   ```javascript
   db.actionitems.find({ organizationId: 'your-org-id' }).count()
   ```

3. **Check if generators are loaded**
   Look for logs: `Using FinancialRiskActionItemGenerator for insight type`

4. **Check if LLM fallback is working**
   Look for logs: `No rule-based generator found, using LLM`

## Expected Flow

```
Insight Created → Check Rule-Based Generators → Generate Action Items → Save to DB
                                     ↓
                              No Generator Found
                                     ↓
                              Use LLM Fallback
                                     ↓
                              Parse JSON Response
                                     ↓
                              Save to DB
```

## Common Issues

### Issue: Action items created but wrong format
- Check LLM prompt response format
- Verify JSON parsing

### Issue: Too many action items
- LLM may be generating 2-4 items when only 1 is needed
- Check prompt quality guidelines

### Issue: No action items for certain insight types
- Check if insight type is in supported types list
- LLM should handle unknown types, check logs
