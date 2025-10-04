import { CustomerSuccessInsight } from '../../../types/customerSuccessInsight';

/**
 * Generate financial risk alerts based on customer financial metrics
 */
export function generateFinancialRiskAlerts(customer: any): CustomerSuccessInsight[] {
  const alerts: CustomerSuccessInsight[] = [];
  const now = new Date();
  
  if (!customer.financialMetrics) {
    return alerts;
  }

  const financial = customer.financialMetrics;

  // 1. Outstanding Balance Alert
  if (financial.outstandingBalance && financial.outstandingBalance > 0) {
    const severity = financial.outstandingBalance > (financial.monthlyRecurringRevenue || 0) ? 'red' : 'yellow';
    alerts.push({
      type: 'outstanding_balance',
      message: `Outstanding balance of $${financial.outstandingBalance.toLocaleString()} requires attention`,
      severity: severity as any,
      category: 'financial_risk',
      meta: { 
        outstandingBalance: financial.outstandingBalance,
        monthlyRecurringRevenue: financial.monthlyRecurringRevenue
      }
    });
  }

  // 2. Payment Reliability Alert
  if (financial.paymentReliability && financial.paymentReliability === 'poor') {
    alerts.push({
      type: 'payment_reliability',
      message: 'Customer has poor payment reliability - monitor closely',
      severity: 'red',
      category: 'financial_risk',
      meta: { paymentReliability: financial.paymentReliability }
    });
  } else if (financial.paymentReliability && financial.paymentReliability === 'fair') {
    alerts.push({
      type: 'payment_reliability',
      message: 'Customer has fair payment reliability - consider payment terms adjustment',
      severity: 'yellow',
      category: 'financial_risk',
      meta: { paymentReliability: financial.paymentReliability }
    });
  }

  // 3. Contract Renewal Alert
  if (financial.contractRenewalDate) {
    const renewalDate = new Date(financial.contractRenewalDate);
    const daysToRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToRenewal <= 30 && daysToRenewal > 0) {
      const severity = daysToRenewal <= 7 ? 'red' : daysToRenewal <= 14 ? 'yellow' : 'info';
      alerts.push({
        type: 'contract_renewal',
        message: `Contract renewal in ${daysToRenewal} days - prepare renewal discussion`,
        severity: severity as any,
        category: 'financial_risk',
        meta: { 
          daysToRenewal,
          renewalDate: financial.contractRenewalDate,
          contractValue: financial.contractValue
        }
      });
    } else if (daysToRenewal <= 90 && daysToRenewal > 30) {
      alerts.push({
        type: 'contract_renewal',
        message: `Contract renewal in ${daysToRenewal} days - start renewal planning`,
        severity: 'info',
        category: 'financial_risk',
        meta: { 
          daysToRenewal,
          renewalDate: financial.contractRenewalDate,
          contractValue: financial.contractValue
        }
      });
    }
  }

  // 4. Credit Score Alert
  if (financial.creditScore) {
    if (financial.creditScore < 600) {
      alerts.push({
        type: 'credit_score',
        message: `Low credit score (${financial.creditScore}) - high financial risk`,
        severity: 'red',
        category: 'financial_risk',
        meta: { creditScore: financial.creditScore }
      });
    } else if (financial.creditScore < 700) {
      alerts.push({
        type: 'credit_score',
        message: `Moderate credit score (${financial.creditScore}) - monitor financial health`,
        severity: 'yellow',
        category: 'financial_risk',
        meta: { creditScore: financial.creditScore }
      });
    }
  }

  // 5. Payment Delay Alert
  if (financial.averagePaymentDays && financial.paymentTerms) {
    const expectedDays = getExpectedPaymentDays(financial.paymentTerms);
    if (financial.averagePaymentDays > expectedDays + 15) {
      alerts.push({
        type: 'payment_delay',
        message: `Average payment delay of ${financial.averagePaymentDays} days (expected: ${expectedDays})`,
        severity: 'yellow',
        category: 'financial_risk',
        meta: { 
          averagePaymentDays: financial.averagePaymentDays,
          expectedDays,
          paymentTerms: financial.paymentTerms
        }
      });
    }
  }

  // 6. Revenue Growth Opportunity
  if (financial.annualRecurringRevenue && financial.monthlyRecurringRevenue) {
    const calculatedMRR = financial.annualRecurringRevenue / 12;
    const actualMRR = financial.monthlyRecurringRevenue;
    
    if (actualMRR > calculatedMRR * 1.1) {
      alerts.push({
        type: 'revenue_growth',
        message: `Strong revenue growth: MRR ($${actualMRR.toLocaleString()}) exceeds ARR calculation`,
        severity: 'info',
        category: 'opportunity',
        meta: { 
          annualRecurringRevenue: financial.annualRecurringRevenue,
          monthlyRecurringRevenue: financial.monthlyRecurringRevenue,
          growthRate: ((actualMRR - calculatedMRR) / calculatedMRR * 100).toFixed(1)
        }
      });
    }
  }

  return alerts;
}

/**
 * Helper function to get expected payment days based on payment terms
 */
function getExpectedPaymentDays(paymentTerms: string): number {
  switch (paymentTerms) {
    case 'net15': return 15;
    case 'net30': return 30;
    case 'net60': return 60;
    case 'net90': return 90;
    case 'prepaid': return 0;
    case 'monthly': return 30;
    case 'annual': return 365;
    default: return 30;
  }
}
