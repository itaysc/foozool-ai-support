# Action Items System

## Overview

The Action Items system automatically generates actionable tasks from insights (and can be created for other purposes) to help teams prioritize and track work. While initially designed for insights, action items can exist independently.

## Schema Design

### ActionItem Schema

The `ActionItem` schema (`server/src/schemas/actionItem.schema.ts`) is designed with Jira-like features to enable task tracking and management:

**Design Note**: Action items can optionally reference an insight via `insightId`, but they can also exist independently. The `organizationId` is kept as a direct field for efficient querying and filtering by organization.

#### Core Fields

- **insightId**: Optional reference to a parent insight - provides access to insight data, etc. (optional - action items can exist without insights)
- **organizationId**: Organization this action item belongs to (required) - kept for efficient queries
- **customerId**: Optional reference to a customer - useful for customer-specific action items (optional)
- **title**: Brief summary of the action (required, max 80 chars recommended)
- **description**: Detailed description of what needs to be done (required)

#### Jira-like Features

- **assignee**: User responsible for completing the action item
- **status**: Current state of the action item (matching Insight schema)
  - `new` - Not yet started (default)
  - `in_progress` - Currently being worked on
  - `resolved` - Completed and resolved
  - `closed` - Closed (work finished)
  - `reopened` - Previously closed but reopened

- **severity**: Priority indicator
  - `critical` - Urgent, immediate attention required
  - `high` - High priority, should be addressed soon
  - `medium` - Standard priority (default)
  - `low` - Lower priority, can wait

- **priority**: Priority level (P0 to P5, where P0 is highest)
  - `P0` - Critical/urgent - needs immediate attention
  - `P1` - High priority - should be addressed soon
  - `P2` - Medium-high priority
  - `P3` - Medium priority (default)
  - `P4` - Low-medium priority
  - `P5` - Low priority - nice to have
  - Default: P2

- **dueDate**: Optional due date for completion

#### Tracking Fields

- **createdBy**: User who created the action item
- **createdAt**: When the action item was created
- **updatedAt**: Last update timestamp (auto-updated)
- **completedAt**: When the action item was completed
- **completedBy**: User who marked it complete

#### Additional Metadata

- **tags**: Array of tags for categorization
- **metadata**: Flexible JSON object for custom data

## Action Item Generation

### Automatic Generation from Insights

Action items are automatically created when new insights are generated through the insights generation job (`server/src/jobs/insights-generator.job.ts`). The job:

1. Creates a new insight
2. Calls `createActionItemsForInsight()` to generate action items (with `insightId` reference)
3. Saves the action items to the database

### Manual Creation

Action items can also be created manually without an insight by omitting the `insightId` field:

```typescript
// Create standalone action item
const actionItem = await ActionItemModel.create({
  organizationId: 'org123',
  title: 'Standalone action item',
  description: 'This action item is not linked to any insight or customer',
  status: 'new'
});

// Create customer-specific action item
const customerActionItem = await ActionItemModel.create({
  organizationId: 'org123',
  customerId: 'customer123',
  title: 'Follow up with customer',
  description: 'Customer-specific task',
  status: 'new'
});
```

### Service: actionItems.service.ts

The service (`server/src/services/insights/actionItems.service.ts`) provides:

#### `generateActionItemsFromInsight(insight, userId)`

Uses AI (LLM) to analyze an insight and generate 2-4 specific, actionable action items. The prompt is tailored based on insight type:

- **NPS Analysis**: Focuses on improving customer experience and addressing detractor feedback
- **Customer Satisfaction (CSAT)**: Targets satisfaction improvement areas
- **Ticket Clusters**: Emphasizes root cause analysis and preventive measures

#### `createActionItemsForInsight(insightId, organizationId, userId)`

Generates and saves action items for a specific insight.

#### `createActionItemsForInsights(insightIds, organizationId, userId)`

Batch creates action items for multiple insights.

## Insight Types Currently Supporting Action Items

The system generates action items for all insight types:

1. **ticket_cluster**: Recurring ticket patterns
2. **nps_analysis**: Net Promoter Score insights
3. **customer_satisfaction**: CSAT analysis
4. **trend_analysis**: Trend patterns
5. **anomaly_detection**: Anomalous behavior
6. **customer_success**: Customer health insights

## Usage Examples

### Creating Action Items Manually

```typescript
import { createActionItemsForInsight } from '../services/insights/actionItems.service';

// Create action items for a specific insight
const actionItems = await createActionItemsForInsight(
  insightId,
  organizationId,
  userId
);

console.log(`Created ${actionItems.length} action items`);
```

### Querying Action Items

```typescript
import { ActionItemModel } from '../schemas/actionItem.schema';

// Find all action items for an insight (if insightId is provided)
const actionItems = await ActionItemModel.find({ insightId });

// Find action items by status (sorted by priority: P0 first)
const newItems = await ActionItemModel.find({ 
  organizationId,
  status: 'new' 
}).sort({ priority: 1 }); // Sort by priority (P0, P1, P2...)

// Find action items assigned to a user
const myItems = await ActionItemModel.find({ 
  organizationId,
  assignee: userId,
  status: { $in: ['new', 'in_progress'] }
});

// Find action items for a specific organization
const orgItems = await ActionItemModel.find({ 
  organizationId 
});

// Find action items for a specific customer
const customerItems = await ActionItemModel.find({ 
  organizationId,
  customerId: 'customer123'
});

// Access insight and customer data from action item
const actionItem = await ActionItemModel.findById(actionItemId)
  .populate('insightId')
  .populate('customerId');
if (actionItem.insightId) {
  const insightData = actionItem.insightId;
}
if (actionItem.customerId) {
  const customerName = actionItem.customerId.name;
}
```

### Updating Action Item Status

```typescript
// Mark as in progress
await ActionItemModel.findByIdAndUpdate(actionItemId, {
  status: 'in_progress',
  updatedAt: new Date()
});

// Mark as resolved
await ActionItemModel.findByIdAndUpdate(actionItemId, {
  status: 'resolved',
  completedAt: new Date(),
  completedBy: userId,
  updatedAt: new Date()
});
```

## Database Indexes

The schema includes optimized indexes for common queries:

- `{ insightId: 1, status: 1 }` (sparse) - Find action items by insight and status
- `{ organizationId: 1, status: 1 }` - Organization-level status queries
- `{ organizationId: 1, assignee: 1, status: 1 }` - User's assigned tasks
- `{ organizationId: 1, customerId: 1, status: 1 }` (sparse) - Customer-specific action items
- `{ organizationId: 1, priority: -1, createdAt: -1 }` - Priority queue
- `{ organizationId: 1, dueDate: 1 }` - Upcoming deadlines
- `{ severity: 1, status: 1 }` - Severity-based filtering
- `{ customerId: 1, status: 1 }` (sparse) - Find action items by customer

## Fallback Behavior

If the LLM fails to generate action items, the system uses predefined fallback action items based on the insight type:

- **NPS Insights**: Investigate detractor feedback, develop improvement plan
- **CSAT Insights**: Review customer satisfaction feedback
- **Ticket Clusters**: Investigate root cause, implement preventive measures

## Integration with Insights Generation

Action item creation is integrated into the main insights generation job. When the job creates a new insight (as opposed to updating an existing one), it automatically:

1. Generates contextual action items using AI
2. Assigns appropriate severity and priority
3. Sets initial status to 'new'
4. Links the action items to the parent insight

This ensures every new insight has associated actionable tasks to help teams respond to the identified issues.
