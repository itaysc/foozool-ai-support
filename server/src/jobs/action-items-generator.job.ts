import { FilterQuery, Types } from 'mongoose';
import { InsightModel, IInsight } from '../schemas/insights.schema';
import { ActionItemModel } from '../schemas/actionItem.schema';
import { createActionItemsForInsight } from '../services/insights/actionItems.service';

export interface ActionItemGenerationJobOptions {
  startDate?: string | Date;
  endDate?: string | Date;
  userId?: string;
  forceRegeneration?: boolean;
}

export interface ActionItemGenerationJobResult {
  processedInsights: number;
  insightsSkipped: number;
  insightsWithErrors: number;
  actionItemsCreated: number;
  errors: Array<{ insightId: string; reason: string }>;
}

function resolveDateBoundary(
  value: string | Date | undefined,
  fallback: Date
): Date {
  if (!value) {
    return fallback;
  }
  const resolved = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(resolved.getTime())) {
    throw new Error(`Invalid date value provided: ${value}`);
  }
  return resolved;
}

/**
 * Generate (or regenerate) action items for insights detected within a date range.
 * By default, insights that already have at least one action item are skipped to avoid duplicates.
 * Pass forceRegeneration=true to bypass the skip check.
 */
export async function runActionItemsGenerationJob(
  options: ActionItemGenerationJobOptions = {}
): Promise<ActionItemGenerationJobResult> {
  const startDate = resolveDateBoundary(options.startDate, new Date(0));
  const endDate = resolveDateBoundary(options.endDate, new Date());

  if (endDate < startDate) {
    throw new Error('endDate must be greater than or equal to startDate');
  }

  console.log('🧾 Action Item Generation Job');
  console.log(`  • startDate: ${startDate.toISOString()}`);
  console.log(`  • endDate:   ${endDate.toISOString()}`);
  console.log(`  • forceRegeneration: ${options.forceRegeneration ? 'yes' : 'no'}`);

  const filter: FilterQuery<IInsight> = {
    firstDetectedAt: {
      $gte: startDate,
      $lte: endDate
    }
  };

  let processed = 0;
  let skipped = 0;
  let createdCount = 0;
  const errors: Array<{ insightId: string; reason: string }> = [];

  const cursor = InsightModel.find(filter)
    .sort({ firstDetectedAt: 1 })
    .cursor();

  for await (const insight of cursor) {
    processed++;
    const insightId = (insight._id as Types.ObjectId).toString();

    try {
      if (!options.forceRegeneration) {
        const hasExistingItems = await ActionItemModel.exists({ insightId });
        if (hasExistingItems) {
          skipped++;
          continue;
        }
      }

      const actionItems = await createActionItemsForInsight(
        insightId,
        (insight.organizationId as Types.ObjectId).toString(),
        options.userId
      );
      createdCount += actionItems.length;
    } catch (error) {
      errors.push({
        insightId,
        reason: error instanceof Error ? error.message : String(error)
      });
      console.error(`❌ Failed to create action items for insight ${insightId}:`, error);
    }
  }

  const result: ActionItemGenerationJobResult = {
    processedInsights: processed,
    insightsSkipped: skipped,
    insightsWithErrors: errors.length,
    actionItemsCreated: createdCount,
    errors
  };

  console.log('✅ Action Item Generation Job complete:', result);
  return result;
}

