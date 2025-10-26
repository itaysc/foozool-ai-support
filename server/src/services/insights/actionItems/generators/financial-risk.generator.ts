import { IActionItemGenerator, InsightForGenerator } from './interface';
import { GeneratedActionItem } from '../types';

export class FinancialRiskActionItemGenerator implements IActionItemGenerator {
  private readonly FINANCIAL_INSIGHT_TYPES = [
    'outstanding_balance',
    'payment_reliability',
    'contract_renewal',
    'payment_delay',
    'credit_score'
  ];

  getSupportedInsightTypes(): string[] {
    return this.FINANCIAL_INSIGHT_TYPES;
  }

  canHandle(insight: InsightForGenerator): boolean {
    // Check if this is a customer success insight with financial risk metadata
    if (insight.insightType !== 'customer_success') return false;
    
    const insightType = insight.metadata?.type as string;
    return this.FINANCIAL_INSIGHT_TYPES.includes(insightType);
  }

  generate(insight: InsightForGenerator): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const insightType = insight.metadata?.type as string;
    const meta = insight.metadata?.meta || {};

    switch (insightType) {
      case 'outstanding_balance':
        items.push(...this.handleOutstandingBalance(meta));
        break;
      
      case 'contract_renewal':
        items.push(...this.handleContractRenewal(meta));
        break;
      
      case 'payment_delay':
        items.push(...this.handlePaymentDelay(meta));
        break;
      
      case 'payment_reliability':
        items.push(...this.handlePaymentReliability(meta));
        break;
      
      case 'credit_score':
        items.push(...this.handleCreditScore(meta));
        break;
    }

    return items;
  }

  private handleOutstandingBalance(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const balance = Number(meta.balance) || Number(meta.outstandingBalance) || 0;
    const daysOverdue = Number(meta.daysOverdue) || 0;

    if (balance > 0) {
      const isCritical = balance > 10000 || daysOverdue > 60;
      
      items.push({
        title: 'Follow up on outstanding payment',
        description: `Outstanding balance: $${balance.toLocaleString()}. ${daysOverdue > 0 ? `Overdue by ${daysOverdue} days.` : ''}`,
        severity: isCritical ? 'critical' : 'high',
        priority: isCritical ? 'P0' : 'P1'
      });
    }

    return items;
  }

  private handleContractRenewal(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const daysUntilRenewal = Number(meta.daysUntilRenewal) || Number(meta.daysToRenewal) || null;

    if (daysUntilRenewal !== null && daysUntilRenewal <= 90) {
      const isUrgent = daysUntilRenewal <= 30;
      
      items.push({
        title: 'Schedule contract renewal discussion',
        description: `Contract renews in ${daysUntilRenewal} days. Prepare renewal strategy and pricing.`,
        severity: isUrgent ? 'critical' : 'high',
        priority: isUrgent ? 'P0' : 'P1'
      });
    }

    return items;
  }

  private handlePaymentDelay(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const delayDays = Number(meta.delayDays) || Number(meta.daysDelayed) || 0;

    if (delayDays > 0) {
      items.push({
        title: 'Investigate payment delay',
        description: `Payment delayed by ${delayDays} days. Contact customer to verify payment status.`,
        severity: delayDays > 14 ? 'critical' : 'high',
        priority: delayDays > 14 ? 'P0' : 'P1'
      });
    }

    return items;
  }

  private handlePaymentReliability(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const reliability = Number(meta.reliability) || Number(meta.paymentReliability) || 0;

    if (reliability < 70) {
      items.push({
        title: 'Review payment reliability issues',
        description: `Payment reliability is ${reliability}%. Multiple late or missed payments detected.`,
        severity: 'high',
        priority: 'P1'
      });
    }

    return items;
  }

  private handleCreditScore(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const creditScore = Number(meta.creditScore) || 0;

    if (creditScore < 600) {
      items.push({
        title: 'Review customer credit score',
        description: `Credit score is ${creditScore}. Consider updating payment terms or requiring deposits.`,
        severity: 'high',
        priority: 'P2'
      });
    }

    return items;
  }
}
