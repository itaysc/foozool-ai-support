# Autonomous AI Support Bot System

This system enables your support application to become an autonomous AI support bot with configurable action thresholds for taking automated actions like refunds, coupons, auto-replies, and more.

## 🚀 Features

### Core Capabilities
- **AI-Powered Ticket Analysis**: Automatically analyzes tickets using LLM to understand sentiment, urgency, and complexity
- **Configurable Action Thresholds**: Define when and how the AI should take specific actions
- **Customer Tier System**: Different permission levels for different customer tiers
- **Comprehensive Action Logging**: Track all automated actions for audit and monitoring
- **Risk Management**: Built-in safeguards and daily limits to prevent abuse

### Supported Actions
- **Refunds**: Automatic refunds based on customer tier and issue type
- **Coupons**: Generate discount coupons for customer satisfaction
- **Auto-Reply**: Send automated responses to customers
- **Auto-Resolve**: Automatically close tickets that meet criteria
- **Escalation**: Escalate tickets to higher priority levels
- **Priority Changes**: Adjust ticket priority based on customer tier

## 📊 System Architecture

### Database Models

#### ActionThreshold
Defines when and how the AI should take actions:
```typescript
{
  organization: ObjectId,
  name: string,
  description: string,
  actionType: 'refund' | 'coupon' | 'auto_resolve' | 'escalate' | 'priority_change' | 'auto_reply',
  conditions: Array<{ field: string, operator: string, value: any }>,
  threshold: number, // Confidence score (0-1)
  isActive: boolean,
  priority: number,
  maxDailyActions?: number,
  actionConfig: {
    refundAmount?: number,
    couponCode?: string,
    couponDiscount?: number,
    autoReplyTemplate?: string,
    escalationLevel?: string,
    newPriority?: string
  }
}
```

#### CustomerTier
Defines customer permission levels:
```typescript
{
  organization: ObjectId,
  name: 'bronze' | 'silver' | 'gold' | 'platinum',
  description: string,
  priority: number,
  autoActionPermissions: {
    refund: { enabled: boolean, maxAmount: number, maxDailyCount: number },
    coupon: { enabled: boolean, maxDiscount: number, maxDailyCount: number },
    autoResolve: { enabled: boolean, maxTicketAgeHours: number },
    escalation: { enabled: boolean, maxEscalationLevel: string },
    priorityChange: { enabled: boolean, allowedPriorities: string[] },
    autoReply: { enabled: boolean, maxDailyCount: number }
  },
  satisfactionThresholds: {
    lowSatisfactionThreshold: number,
    highSatisfactionThreshold: number
  }
}
```

#### ActionLog
Tracks all automated actions:
```typescript
{
  organization: ObjectId,
  ticketId: ObjectId,
  actionThresholdId: ObjectId,
  actionType: string,
  confidenceScore: number,
  executedAt: Date,
  status: 'pending' | 'executed' | 'failed' | 'reverted',
  details: {
    refundAmount?: number,
    couponCode?: string,
    autoReplyContent?: string,
    // ... other action-specific data
  },
  metadata: {
    triggeredBy: 'ai_analysis' | 'manual_trigger' | 'scheduled',
    processingTimeMs: number,
    errorMessage?: string
  }
}
```

## 🔧 Setup and Configuration

### 1. Database Setup
The system automatically creates the necessary collections when you run the seed script:

```bash
npm run seed
```

### 2. Default Customer Tiers
The system creates four default customer tiers:

- **Bronze**: Basic tier with limited auto-actions
- **Silver**: Standard tier with moderate auto-actions
- **Gold**: Premium tier with enhanced auto-actions
- **Platinum**: VIP tier with full auto-action capabilities

### 3. Sample Action Thresholds
The seed script creates sample thresholds for common scenarios:

- Low satisfaction auto-replies
- High priority escalations
- Gold customer refunds for defective products
- Platinum customer coupons for delays
- Old ticket auto-resolution
- Priority upgrades for VIP customers

## 🎯 Usage Examples

### Analyzing a Ticket
```typescript
import { AutonomousAIService } from './services/autonomousAI';

const analysis = await AutonomousAIService.analyzeTicket(ticketId, organizationId);
console.log(analysis.recommendedActions);
```

### Creating a Custom Threshold
```typescript
import { ActionThresholdService } from './services/autonomousAI/actionThreshold.service';

const threshold = await ActionThresholdService.createThreshold({
  organization: organizationId,
  name: 'High Value Customer Refund',
  description: 'Auto-refund for high-value customers with technical issues',
  actionType: 'refund',
  conditions: [
    { field: 'customer_tier', operator: 'equals', value: 'platinum' },
    { field: 'tags', operator: 'contains', value: 'technical' }
  ],
  threshold: 0.85,
  isActive: true,
  priority: 3,
  maxDailyActions: 3,
  actionConfig: {
    refundAmount: 100
  }
});
```

### Executing an Action
```typescript
const result = await AutonomousAIService.executeAction({
  ticketId: 'ticket_id',
  organizationId: 'org_id',
  actionType: 'refund',
  thresholdId: 'threshold_id',
  confidenceScore: 0.9,
  parameters: {
    refundAmount: 50
  }
});
```

## 📈 Monitoring and Analytics

### Action Logs
Track all automated actions:
```typescript
// Get recent action logs
const logs = await ActionLogService.getLogsByOrganization(organizationId, 50, 0);

// Get failed actions for review
const failedActions = await ActionLogService.getFailedActions(organizationId, 20);

// Get high-confidence actions
const highConfidenceActions = await ActionLogService.getHighConfidenceActions(organizationId, 0.8, 20);
```

### Performance Metrics
```typescript
// Get daily statistics
const dailyStats = await ActionLogService.getDailyStats(organizationId, new Date());

// Get success rates
const successRates = await ActionLogService.getSuccessRate(organizationId, startDate, endDate);

// Get performance metrics
const metrics = await ActionLogService.getPerformanceMetrics(organizationId, 30);
```

## 🔒 Security and Risk Management

### Built-in Safeguards
1. **Daily Limits**: Each action type has configurable daily limits
2. **Customer Tier Permissions**: Actions are restricted based on customer tier
3. **Confidence Thresholds**: Actions only execute when AI confidence is high enough
4. **Action Logging**: All actions are logged for audit purposes
5. **Manual Override**: Actions can be reverted or modified manually

### Best Practices
1. **Start Conservative**: Begin with high confidence thresholds (0.8+) and low daily limits
2. **Monitor Regularly**: Review action logs and success rates weekly
3. **Test Thoroughly**: Test thresholds in a staging environment first
4. **Gradual Rollout**: Enable features gradually and monitor impact
5. **Human Oversight**: Keep human agents available for complex cases

## 🚀 API Endpoints

### Ticket Analysis
- `GET /api/v1/autonomous-ai/analyze/:ticketId` - Analyze a ticket and get recommendations

### Action Execution
- `POST /api/v1/autonomous-ai/execute-action` - Execute a recommended action

### Action Thresholds
- `GET /api/v1/autonomous-ai/thresholds` - Get all thresholds
- `POST /api/v1/autonomous-ai/thresholds` - Create a new threshold
- `PUT /api/v1/autonomous-ai/thresholds/:id` - Update a threshold
- `DELETE /api/v1/autonomous-ai/thresholds/:id` - Delete a threshold
- `PATCH /api/v1/autonomous-ai/thresholds/:id/toggle` - Toggle threshold status

### Customer Tiers
- `GET /api/v1/autonomous-ai/customer-tiers` - Get all customer tiers
- `POST /api/v1/autonomous-ai/customer-tiers` - Create a new tier
- `POST /api/v1/autonomous-ai/customer-tiers/default` - Create default tiers
- `PUT /api/v1/autonomous-ai/customer-tiers/:id` - Update a tier

### Action Logs
- `GET /api/v1/autonomous-ai/action-logs` - Get action logs
- `GET /api/v1/autonomous-ai/action-logs/ticket/:ticketId` - Get logs for a specific ticket
- `GET /api/v1/autonomous-ai/action-logs/stats/daily` - Get daily statistics
- `GET /api/v1/autonomous-ai/action-logs/stats/success-rate` - Get success rates
- `GET /api/v1/autonomous-ai/action-logs/failed` - Get failed actions
- `GET /api/v1/autonomous-ai/action-logs/high-confidence` - Get high-confidence actions

## 🔧 Customization

### Adding New Action Types
1. Update the `ActionType` enum in `types/autonomousAI.ts`
2. Add the action type to the schema
3. Implement the action logic in `AutonomousAIService.performAction()`
4. Update the API routes if needed

### Custom Conditions
The system supports flexible conditions:
- `equals`: Exact match
- `greater_than`: Numeric comparison
- `less_than`: Numeric comparison
- `contains`: String contains
- `in`: Array membership

### Field Mapping
Available fields for conditions:
- `priority`: Ticket priority
- `satisfaction_rating`: Customer satisfaction score
- `ticket_age_hours`: Hours since ticket creation
- `customer_tier`: Customer tier level
- `status`: Ticket status
- `tags`: Ticket tags

## 🐛 Troubleshooting

### Common Issues

1. **Actions Not Executing**
   - Check if thresholds are active
   - Verify confidence scores meet thresholds
   - Check daily limits
   - Review customer tier permissions

2. **High Failure Rate**
   - Lower confidence thresholds
   - Review action configurations
   - Check external system integrations
   - Monitor error logs

3. **Performance Issues**
   - Optimize database queries
   - Implement caching for frequently accessed data
   - Monitor AI analysis response times
   - Consider batch processing for high-volume scenarios

### Debug Mode
Enable debug logging by setting the environment variable:
```bash
DEBUG=autonomous-ai:*
```

## 📚 Additional Resources

- [API Documentation](./api.md)
- [Configuration Guide](./configuration.md)
- [Best Practices](./best-practices.md)
- [Troubleshooting Guide](./troubleshooting.md)

## 🤝 Contributing

When contributing to the autonomous AI system:

1. Follow the existing code structure
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Consider backward compatibility
5. Test thoroughly in staging environment

## 📄 License

This autonomous AI system is part of the Foozool Support AI project. 