import { CustomerSuccessInsight } from '../../../types/customerSuccessInsight';
import { ICustomer } from '../../../types/customer';

/**
 * Generate insights based on customer success criteria and KPIs
 */
export function generateSuccessCriteriaInsights(customer: ICustomer): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!customer.successCriteria) {
    return insights;
  }

  const successCriteria = customer.successCriteria;
  const customerName = customer.name || 'Customer';

  // Generate insights for primary metrics
  insights.push(...generatePrimaryMetricsInsights(successCriteria, customerName));
  
  // Generate insights for KPIs
  insights.push(...generateKPIsInsights(successCriteria, customerName));
  
  // Generate insights for satisfaction benchmarks
  insights.push(...generateSatisfactionBenchmarksInsights(successCriteria, customerName));

  console.log(`[Success Criteria Insights] Generated ${insights.length} insights for ${customerName}`);
  return insights;
}

/**
 * Generate insights for primary business metrics
 */
function generatePrimaryMetricsInsights(successCriteria: ICustomer['successCriteria'], customerName: string): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!successCriteria?.primaryMetrics || successCriteria.primaryMetrics.length === 0) {
    return insights;
  }

  successCriteria.primaryMetrics.forEach((metric, index) => {
    if (!metric.name || metric.currentValue === undefined || metric.targetValue === undefined) {
      return; // Skip incomplete metrics
    }

    const performance = (metric.currentValue / metric.targetValue) * 100;
    const gap = metric.targetValue - metric.currentValue;
    const gapPercentage = (gap / metric.targetValue) * 100;

    // Critical metrics underperforming
    if (metric.importance === 'critical' && performance < 80) {
      insights.push({
        type: 'critical_metric_underperformance',
        message: `Critical metric "${metric.name}" is ${performance.toFixed(1)}% of target (${metric.currentValue}/${metric.targetValue} ${metric.unit})`,
        severity: 'red',
        category: 'success_criteria',
        meta: {
          metricName: metric.name,
          currentValue: metric.currentValue,
          targetValue: metric.targetValue,
          unit: metric.unit,
          performance: performance.toFixed(1),
          gap: gap,
          gapPercentage: gapPercentage.toFixed(1),
          importance: metric.importance
        },
        guidance: {
          summary: `Critical business metric "${metric.name}" requires immediate attention`,
          whyItMatters: `This metric directly impacts customer success and business outcomes. Critical metrics below 80% of target indicate significant risk to customer satisfaction and retention.`,
          signals: [
            `Current value: ${metric.currentValue} ${metric.unit}`,
            `Target value: ${metric.targetValue} ${metric.unit}`,
            `Performance: ${performance.toFixed(1)}% of target`,
            `Gap: ${gap.toFixed(1)} ${metric.unit} (${gapPercentage.toFixed(1)}%)`
          ],
          recommendedActions: [
            'Schedule immediate customer success review meeting',
            'Identify root causes of underperformance',
            'Develop 30-day improvement action plan',
            'Escalate to account manager and CS leadership',
            'Set up weekly progress tracking'
          ],
          investigationPath: [
            'Review customer usage patterns and adoption',
            'Analyze recent support tickets related to this metric',
            'Check stakeholder engagement and feedback',
            'Evaluate product configuration and setup',
            'Assess training and onboarding effectiveness'
          ],
          considerations: [
            'External factors may be impacting performance',
            'Target may need adjustment based on market conditions',
            'Customer may need additional support or resources',
            'Product limitations may be constraining achievement'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'Critical Metric Review', amount: 2, unit: 'days' }
        },
        evidence: {
          supportingData: {
            metricPerformance: `${performance.toFixed(1)}%`,
            gapAnalysis: `${gap.toFixed(1)} ${metric.unit} below target`,
            importanceLevel: metric.importance,
            lastUpdated: successCriteria.lastUpdated
          },
          relatedLinks: [
            { title: 'Customer Success Dashboard', url: '/customers/success' },
            { title: 'Metric Tracking Report', url: '/reports/metrics' }
          ]
        }
      });
    }

    // High importance metrics underperforming
    else if (metric.importance === 'high' && performance < 70) {
      insights.push({
        type: 'high_metric_underperformance',
        message: `High-priority metric "${metric.name}" is ${performance.toFixed(1)}% of target - action needed`,
        severity: 'yellow',
        category: 'success_criteria',
        meta: {
          metricName: metric.name,
          currentValue: metric.currentValue,
          targetValue: metric.targetValue,
          unit: metric.unit,
          performance: performance.toFixed(1),
          gap: gap,
          gapPercentage: gapPercentage.toFixed(1),
          importance: metric.importance
        },
        guidance: {
          summary: `High-priority metric "${metric.name}" requires focused attention`,
          whyItMatters: `High-priority metrics are key indicators of customer success. Performance below 70% suggests potential issues that could impact customer satisfaction.`,
          recommendedActions: [
            'Schedule customer success check-in meeting',
            'Analyze performance trends over last 90 days',
            'Identify improvement opportunities',
            'Develop 60-day improvement plan',
            'Monitor progress weekly'
          ],
          investigationPath: [
            'Review historical performance data',
            'Analyze customer feedback and support tickets',
            'Check stakeholder satisfaction surveys',
            'Evaluate product usage patterns'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'High Priority Metric Review', amount: 5, unit: 'days' }
        },
        evidence: {
          supportingData: {
            metricPerformance: `${performance.toFixed(1)}%`,
            gapAnalysis: `${gap.toFixed(1)} ${metric.unit} below target`,
            importanceLevel: metric.importance
          }
        }
      });
    }

    // Metrics exceeding targets
    else if (performance > 120) {
      insights.push({
        type: 'metric_exceeding_target',
        message: `Metric "${metric.name}" exceeds target by ${(performance - 100).toFixed(1)}% - success story opportunity`,
        severity: 'info',
        category: 'opportunity',
        meta: {
          metricName: metric.name,
          currentValue: metric.currentValue,
          targetValue: metric.targetValue,
          unit: metric.unit,
          performance: performance.toFixed(1),
          overperformance: (performance - 100).toFixed(1),
          importance: metric.importance
        },
        guidance: {
          summary: `Metric "${metric.name}" is exceeding expectations`,
          whyItMatters: `Strong performance creates opportunities for case studies, testimonials, and expansion discussions.`,
          recommendedActions: [
            'Document success story and best practices',
            'Request customer testimonial or case study',
            'Identify expansion opportunities',
            'Share success with internal team',
            'Use as reference for other customers'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'Success Story Documentation', amount: 7, unit: 'days' }
        },
        evidence: {
          supportingData: {
            metricPerformance: `${performance.toFixed(1)}%`,
            overperformance: `${(performance - 100).toFixed(1)}% above target`,
            successIndicator: 'Exceeding target'
          }
        }
      });
    }
  });

  return insights;
}

/**
 * Generate insights for KPIs
 */
function generateKPIsInsights(successCriteria: ICustomer['successCriteria'], customerName: string): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!successCriteria?.kpis || successCriteria.kpis.length === 0) {
    return insights;
  }

  successCriteria.kpis.forEach((kpi, index) => {
    if (!kpi.name || kpi.currentValue === undefined || kpi.targetValue === undefined) {
      return; // Skip incomplete KPIs
    }

    const performance = (kpi.currentValue / kpi.targetValue) * 100;
    const gap = kpi.targetValue - kpi.currentValue;

    // KPI underperforming based on measurement period
    if (performance < 80) {
      const severity = performance < 60 ? 'red' : 'yellow';
      const urgency = kpi.measurementPeriod === 'daily' ? 'immediate' : 
                     kpi.measurementPeriod === 'weekly' ? 'urgent' : 'moderate';

      insights.push({
        type: 'kpi_underperformance',
        message: `KPI "${kpi.name}" (${kpi.measurementPeriod}) is ${performance.toFixed(1)}% of target`,
        severity: severity as any,
        category: 'success_criteria',
        meta: {
          kpiName: kpi.name,
          currentValue: kpi.currentValue,
          targetValue: kpi.targetValue,
          unit: kpi.unit,
          measurementPeriod: kpi.measurementPeriod,
          performance: performance.toFixed(1),
          gap: gap,
          urgency: urgency
        },
        guidance: {
          summary: `${kpi.measurementPeriod.charAt(0).toUpperCase() + kpi.measurementPeriod.slice(1)} KPI "${kpi.name}" requires attention`,
          whyItMatters: `KPIs with ${kpi.measurementPeriod} measurement periods require ${urgency} attention when underperforming.`,
          recommendedActions: [
            `Review ${kpi.measurementPeriod} performance trends`,
            'Identify contributing factors',
            `Develop ${urgency} action plan`,
            'Implement monitoring and alerting',
            'Schedule follow-up review'
          ],
          investigationPath: [
            `Analyze ${kpi.measurementPeriod} historical data`,
            'Review related support tickets and feedback',
            'Check system performance and availability',
            'Evaluate user behavior patterns'
          ],
          owner: 'Customer Success Manager',
          sla: { 
            name: `${kpi.measurementPeriod.charAt(0).toUpperCase() + kpi.measurementPeriod.slice(1)} KPI Review`, 
            amount: urgency === 'immediate' ? 1 : urgency === 'urgent' ? 3 : 7, 
            unit: 'days' 
          }
        },
        evidence: {
          supportingData: {
            kpiPerformance: `${performance.toFixed(1)}%`,
            measurementFrequency: kpi.measurementPeriod,
            gapAnalysis: `${gap.toFixed(1)} ${kpi.unit} below target`,
            urgencyLevel: urgency
          }
        }
      });
    }
  });

  return insights;
}

/**
 * Generate insights for satisfaction benchmarks
 */
function generateSatisfactionBenchmarksInsights(successCriteria: ICustomer['successCriteria'], customerName: string): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!successCriteria?.satisfactionBenchmarks) {
    return insights;
  }

  const benchmarks = successCriteria.satisfactionBenchmarks;

  // NPS insights
  if (benchmarks.nps?.current !== undefined && benchmarks.nps?.target !== undefined) {
    const npsGap = benchmarks.nps.target - benchmarks.nps.current;
    const npsPerformance = (benchmarks.nps.current / benchmarks.nps.target) * 100;

    if (npsGap > 10) {
      insights.push({
        type: 'nps_below_target',
        message: `NPS score ${benchmarks.nps.current} is ${npsGap} points below target (${benchmarks.nps.target})`,
        severity: 'yellow',
        category: 'success_criteria',
        meta: {
          currentNPS: benchmarks.nps.current,
          targetNPS: benchmarks.nps.target,
          gap: npsGap,
          performance: npsPerformance.toFixed(1)
        },
        guidance: {
          summary: `Net Promoter Score requires improvement`,
          whyItMatters: `NPS is a key indicator of customer satisfaction and likelihood to recommend. Scores below target indicate potential retention risk.`,
          recommendedActions: [
            'Conduct NPS follow-up interviews with detractors',
            'Analyze common themes in negative feedback',
            'Implement improvement initiatives',
            'Track NPS trends monthly',
            'Develop customer advocacy program'
          ],
          investigationPath: [
            'Review recent customer feedback and surveys',
            'Analyze support ticket sentiment',
            'Check stakeholder satisfaction scores',
            'Evaluate product usage and adoption'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'NPS Improvement Plan', amount: 14, unit: 'days' }
        },
        evidence: {
          supportingData: {
            currentNPS: benchmarks.nps.current,
            targetNPS: benchmarks.nps.target,
            gap: `${npsGap} points below target`,
            lastUpdated: benchmarks.nps.lastUpdated
          },
          relatedLinks: [
            { title: 'NPS Dashboard', url: '/satisfaction/nps' },
            { title: 'Customer Feedback Analysis', url: '/feedback/analysis' }
          ]
        }
      });
    }
  }

  // CSAT insights
  if (benchmarks.csat?.current !== undefined && benchmarks.csat?.target !== undefined) {
    const csatGap = benchmarks.csat.target - benchmarks.csat.current;

    if (csatGap > 0.5) {
      insights.push({
        type: 'csat_below_target',
        message: `CSAT score ${benchmarks.csat.current}/5 is ${csatGap.toFixed(1)} points below target (${benchmarks.csat.target}/5)`,
        severity: 'yellow',
        category: 'success_criteria',
        meta: {
          currentCSAT: benchmarks.csat.current,
          targetCSAT: benchmarks.csat.target,
          gap: csatGap
        },
        guidance: {
          summary: `Customer Satisfaction score needs improvement`,
          whyItMatters: `CSAT directly reflects customer satisfaction with your service. Scores below target indicate service quality issues.`,
          recommendedActions: [
            'Review recent CSAT survey responses',
            'Identify common satisfaction issues',
            'Improve service delivery processes',
            'Enhance customer support quality',
            'Implement satisfaction tracking'
          ],
          investigationPath: [
            'Analyze CSAT survey comments',
            'Review support ticket resolution quality',
            'Check response times and resolution rates',
            'Evaluate customer communication effectiveness'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'CSAT Improvement Plan', amount: 10, unit: 'days' }
        },
        evidence: {
          supportingData: {
            currentCSAT: benchmarks.csat.current,
            targetCSAT: benchmarks.csat.target,
            gap: `${csatGap.toFixed(1)} points below target`,
            lastUpdated: benchmarks.csat.lastUpdated
          }
        }
      });
    }
  }

  // Custom satisfaction metrics
  if (benchmarks.customMetrics && benchmarks.customMetrics.length > 0) {
    benchmarks.customMetrics.forEach((metric, index) => {
      if (!metric.name || metric.current === undefined || metric.target === undefined) {
        return;
      }

      const performance = (metric.current / metric.target) * 100;
      const gap = metric.target - metric.current;

      if (performance < 80) {
        insights.push({
          type: 'custom_satisfaction_metric_below_target',
          message: `Custom metric "${metric.name}" is ${performance.toFixed(1)}% of target`,
          severity: 'yellow',
          category: 'success_criteria',
          meta: {
            metricName: metric.name,
            currentValue: metric.current,
            targetValue: metric.target,
            scale: metric.scale,
            performance: performance.toFixed(1),
            gap: gap
          },
          guidance: {
            summary: `Custom satisfaction metric "${metric.name}" requires attention`,
            whyItMatters: `Custom metrics provide specific insights into customer satisfaction areas. Underperformance indicates targeted improvement needs.`,
            recommendedActions: [
              'Review metric definition and measurement method',
              'Analyze factors affecting this specific metric',
              'Develop targeted improvement initiatives',
              'Monitor progress regularly',
              'Adjust measurement approach if needed'
            ],
            owner: 'Customer Success Manager',
            sla: { name: 'Custom Metric Review', amount: 7, unit: 'days' }
          },
          evidence: {
            supportingData: {
              metricName: metric.name,
              currentValue: metric.current,
              targetValue: metric.target,
              scale: metric.scale,
              performance: `${performance.toFixed(1)}%`,
              lastUpdated: metric.lastUpdated
            }
          }
        });
      }
    });
  }

  return insights;
}
