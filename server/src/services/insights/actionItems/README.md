# Action Items Generation System

## Overview

This directory contains the hybrid action item generation system that uses both rule-based and LLM-based approaches to create action items from insights.

## Architecture

### Generators (`generators/`)

Rule-based generators that create action items from specific insight types:

1. **FinancialRiskActionItemGenerator** - Handles financial risk insights
   - Outstanding balance
   - Contract renewal
   - Payment delays
   - Payment reliability
   - Credit score issues

2. **CapacityActionItemGenerator** - Handles capacity-related insights
   - Storage capacity warnings/critical
   - User capacity issues
   - Upgrade approaching/overdue
   - Transaction/API capacity warnings

3. **HealthScoreActionItemGenerator** - Handles customer health insights
   - Health score at risk/critical
   - Declining activity
   - Inactive customers
   - Feature adoption decline

4. **SupportMetricsActionItemGenerator** - Handles support metrics insights
   - High ticket volume
   - Escalation rate increase
   - SLA breach patterns
   - Resolution time degradation

5. **StakeholderEngagementGenerator** - Handles stakeholder engagement insights (Hybrid)
   - Key stakeholder disengagement
   - Champion unidentified
   - Executive engagement opportunities
   - Cross-department engagement

6. **RecurringProblemsGenerator** - Handles recurring problems insights (Hybrid)
   - Recurring ticket patterns
   - Frequent service interruptions
   - Repeated feature requests
   - Chronic technical issues

### Service (`actionItems.service.ts`)

Main service that:
- Attempts rule-based generation first
- Falls back to LLM generation when rules don't apply
- Creates and saves action items to the database

## Implementation Status

### Phase 1: Rule-Based Generators (COMPLETED ✅)
✅ Financial Risk Generator
✅ Capacity Generator
✅ Health Score Generator
✅ Basic Support Metrics Generator

### Phase 2: Hybrid Approach (COMPLETED ✅)
✅ Stakeholder engagement generator with rule-based templates
✅ Recurring problems generator with template-based actions

### Phase 3: Full LLM Integration (COMPLETED ✅)
✅ LLM fallback already implemented and working
✅ Handles 80+ remaining insight types (strategic, advanced engagement, success criteria, etc.)
✅ Context-aware prompts with quality-focused generation
✅ See PHASE3_COVERAGE.md for full breakdown

## Usage

```typescript
import { createActionItemsForInsight } from './actionItems.service';

// Generate action items for an insight
const actionItems = await createActionItemsForInsight(
  insightId,
  organizationId,
  userId
);
```

## Adding New Generators

1. Create a new generator class implementing `IActionItemGenerator`
2. Add it to `generators/index.ts`
3. Import and register it in `actionItems.service.ts`

Example:

```typescript
export class MyCustomGenerator implements IActionItemGenerator {
  getSupportedInsightTypes(): string[] {
    return ['my_insight_type'];
  }

  canHandle(insight: IInsight): boolean {
    return insight.insightType === 'my_insight_type';
  }

  generate(insight: IInsight): GeneratedActionItem[] {
    // Your generation logic
    return [];
  }
}
```
