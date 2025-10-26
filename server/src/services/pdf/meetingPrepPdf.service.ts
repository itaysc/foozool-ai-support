import PDFDocument from 'pdfkit';
import { CustomerSuccessInsight } from '../../types/customerSuccessInsight';
import { RiskAssessment } from '../customers/riskAssessment.service';
import { HealthScoreFactors } from '../insights/healthScore.service';
import { NewsResult } from '../news/types';

export interface CustomerData {
  name: string;
  industry?: string;
  companySize?: string;
  segment?: string;
  contractValue?: string;
  startDate?: string;
  accountManager?: string;
  healthScore?: string;
  operatingRegions?: string[];
  countriesServed?: string[];
  financialMetrics?: {
    contractValue?: number;
    annualRecurringRevenue?: number;
    monthlyRecurringRevenue?: number;
    contractRenewalDate?: string | Date;
    paymentHistory?: Array<{
      date: string | Date;
      amount: number;
      status: 'paid' | 'overdue' | 'pending' | 'failed';
      method?: string;
      invoiceNumber?: string;
    }>;
    creditScore?: number;
    paymentTerms?: 'net15' | 'net30' | 'net60' | 'net90' | 'prepaid' | 'monthly' | 'annual';
    lastPaymentDate?: string | Date;
    outstandingBalance?: number;
    averagePaymentDays?: number;
    paymentReliability?: 'excellent' | 'good' | 'fair' | 'poor';
  };
  languages?: string[];
  exchange?: string;
  ticker?: string;
  domains?: string[];
  competitorNames?: string[];
  productLines?: string[];
  newsKeywords?: string[];
  excludedKeywords?: string[];
  website?: string;
  hq?: {
    country?: string;
    region?: string;
    city?: string;
  };
  usageData?: {
    activeUsersCount?: string;
    seatsPurchased?: string;
    seatsUsed?: string;
  };
  notes?: string;
}

export interface MeetingPrepData {
  customer: CustomerData;
  insights: CustomerSuccessInsight[];
  documentContent: string;
  generatedAt: Date;
  generatedBy: string;
  riskAssessment?: RiskAssessment;
  healthScore?: HealthScoreFactors;
  customerNews?: NewsResult;
}

export class MeetingPrepPdfGenerator {
  private doc: any;
  private currentY: number = 0;
  private pageWidth: number = 612; // Standard letter width
  private pageHeight: number = 792; // Standard letter height
  private margin: number = 50;
  private contentWidth: number = this.pageWidth - (this.margin * 2);

  constructor() {
    this.doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: this.margin,
        bottom: this.margin,
        left: this.margin,
        right: this.margin
      },
      font: 'Helvetica',
      autoFirstPage: true
    });
  }

  generatePdf(data: MeetingPrepData): any {
    console.log('PDF: Starting PDF generation...');
    this.addHeader(data.customer.name, data.generatedAt);
    console.log('PDF: Header added');
    
    this.addCustomerProfile(data.customer);
    console.log('PDF: Customer profile added');
    
    this.addHealthScore(data.healthScore);
    console.log('PDF: Health score added');
    
    this.addRiskAssessment(data.riskAssessment);
    console.log('PDF: Risk assessment added');
    
    
    this.addInsights(data.insights);
    console.log('PDF: Insights added');
    
    this.addDocumentContent(data.documentContent);
    console.log('PDF: Document content added');
    
    this.addFooter(data.generatedBy);
    console.log('PDF: Footer added');

    // Ensure no empty pages at the end
    this.ensureNoEmptyPages();
    console.log('PDF: Empty pages check completed');

    console.log('PDF: PDF generation completed successfully');
    return this.doc;
  }

  private addHeader(customerName: string, generatedAt: Date): void {
    // Main title - make it more prominent
    this.doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('Customer Meeting Preparation', this.margin, this.margin, {
        align: 'center'
      });

    this.currentY = this.margin + 45;

    // Customer name - larger and more prominent
    this.doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#2d3748')
      .text(customerName, this.margin, this.currentY, {
        align: 'center'
      });

    this.currentY += 35;

    // Generated date
    this.doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#718096')
      .text(`Generated on ${generatedAt.toLocaleDateString()} at ${generatedAt.toLocaleTimeString()}`, this.margin, this.currentY, {
        align: 'center'
      });

    this.currentY += 45;

    // Thicker divider line
    this.doc
      .strokeColor('#cbd5e0')
      .lineWidth(2)
      .moveTo(this.margin, this.currentY)
      .lineTo(this.pageWidth - this.margin, this.currentY)
      .stroke();

    this.currentY += 25;
  }

  private addCustomerProfile(customer: CustomerData): void {
    this.addSectionTitle('Customer Profile');

    const profileData = [
      { label: 'Industry', value: customer.industry || 'N/A' },
      { label: 'Company Size', value: customer.companySize || 'N/A' },
      { label: 'Segment', value: customer.segment || 'N/A' },
      { label: 'Contract Value', value: customer.contractValue || 'N/A' },
      { label: 'Start Date', value: customer.startDate || 'N/A' },
      { label: 'Account Manager', value: customer.accountManager || 'N/A' },
      { label: 'Health Score', value: customer.healthScore || 'N/A' },
      { label: 'Website', value: customer.website || 'N/A' },
    ];

    // Create two columns for profile data
    const leftColumn = profileData.slice(0, 4);
    const rightColumn = profileData.slice(4);

    this.addTwoColumnData(leftColumn, rightColumn);

    // Additional sections
    if (customer.operatingRegions?.length) {
      this.addFieldWithList('Operating Regions', customer.operatingRegions);
    }

    if (customer.competitorNames?.length) {
      this.addFieldWithList('Competitors', customer.competitorNames);
    }

    if (customer.usageData) {
      this.addUsageData(customer.usageData);
    }
  }

  private addHealthScore(healthScore?: HealthScoreFactors): void {
    if (!healthScore) return;

    this.addSectionTitle('Customer Health Score');

    // Overall health score with color coding
    const overallColor = this.getHealthScoreColor(healthScore.overallScore);
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor(overallColor)
      .text(`Overall Health Score: ${healthScore.overallScore}/10`, this.margin, this.currentY);
    
    this.currentY += 20;

    // Health score breakdown
    const healthData = [
      { label: 'Support Health', score: healthScore.supportHealth.score, color: this.getHealthScoreColor(healthScore.supportHealth.score) },
      { label: 'Engagement Health', score: healthScore.engagementHealth.score, color: this.getHealthScoreColor(healthScore.engagementHealth.score) },
      { label: 'Business Health', score: healthScore.businessHealth.score, color: this.getHealthScoreColor(healthScore.businessHealth.score) }
    ];

    healthData.forEach(item => {
      this.doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#4a5568')
        .text(`${item.label}:`, this.margin, this.currentY);
      
      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor(item.color)
        .text(`${item.score}/10`, this.margin + 120, this.currentY);
      
      this.currentY += 15;
    });

    this.currentY += 10;
  }

  private addRiskAssessment(riskAssessment?: RiskAssessment): void {
    if (!riskAssessment) return;

    this.addSectionTitle('Risk Assessment');

    // Overall risk alert
    const overallRiskColor = this.getRiskColor(riskAssessment.overallRisk.level);
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor(overallRiskColor)
      .text(`Overall Risk Level: ${riskAssessment.overallRisk.level.toUpperCase()} (${riskAssessment.overallRisk.score}/100)`, this.margin, this.currentY);
    
    this.currentY += 20;

    // Risk breakdown
    const risks = [
      { 
        name: 'Churn Risk', 
        risk: riskAssessment.churnRisk,
        icon: '[CHURN]'
      },
      { 
        name: 'Satisfaction Risk', 
        risk: riskAssessment.satisfactionRisk,
        icon: '[SATISFACTION]'
      },
      { 
        name: 'Engagement Risk', 
        risk: riskAssessment.engagementRisk,
        icon: '[ENGAGEMENT]'
      }
    ];

    risks.forEach(riskItem => {
      if (riskItem.risk.level === 'high' || riskItem.risk.level === 'critical') {
        const riskColor = this.getRiskColor(riskItem.risk.level);
        
        this.doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(riskColor)
          .text(`${riskItem.icon} ${riskItem.name}: ${riskItem.risk.level.toUpperCase()}`, this.margin, this.currentY);
        
        this.currentY += 15;

        // Evidence - simplified positioning
        if (riskItem.risk.evidence.length > 0) {
          this.doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#4a5568')
            .text('Evidence:', this.margin + 20, this.currentY);
          
          this.currentY += 12;
          
          // Let PDFKit handle text flow for evidence items
          const evidenceText = riskItem.risk.evidence.map(e => `• ${e}`).join('\n');
          this.doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#718096')
            .text(evidenceText, this.margin + 30, this.currentY, {
              width: this.contentWidth - 30
            });
          
          this.currentY += (riskItem.risk.evidence.length * 12) + 5;
        }

        // Recommendations - simplified positioning
        if (riskItem.risk.recommendations.length > 0) {
          this.doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#2d3748')
            .text('Recommended Actions:', this.margin + 20, this.currentY);
          
          this.currentY += 12;
          
          // Let PDFKit handle text flow for recommendations
          const recommendationsText = riskItem.risk.recommendations.slice(0, 3).map(r => `• ${r}`).join('\n');
          this.doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#4a5568')
            .text(recommendationsText, this.margin + 30, this.currentY, {
              width: this.contentWidth - 30
            });
          
          this.currentY += (Math.min(riskItem.risk.recommendations.length, 3) * 12) + 5;
        }

        this.currentY += 10;
      }
    });
  }


  private addInsights(insights: CustomerSuccessInsight[]): void {
    if (insights.length === 0) return;

    this.addSectionTitle('Customer Success Insights');

    const insightsByCategory = insights.reduce((acc, insight) => {
      if (!acc[insight.category]) acc[insight.category] = [];
      acc[insight.category].push(insight);
      return acc;
    }, {} as Record<string, CustomerSuccessInsight[]>);

    Object.entries(insightsByCategory).forEach(([category, categoryInsights]) => {
      this.addCategoryTitle(category);
      
      categoryInsights.forEach(insight => {
        this.addInsightItem(insight);
      });
    });
  }

  private addDocumentContent(content: string): void {
    this.addSectionTitle('Meeting Preparation Document');

    console.log('PDF: Document content length:', content.length);
    console.log('PDF: Document content preview:', content.substring(0, 500));

    // Render content directly using PDFKit's native formatting - no complex parsing needed!
    console.log('PDF: Rendering content directly with PDFKit formatting');
    this.addRawContent(content);
  }

  private addFooter(generatedBy: string): void {
    // Ensure we have enough space for footer
    this.checkPageBreak(40);
    
    const footerY = this.currentY + 20;
    
    this.doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#718096')
      .text(`Page ${this.doc.pageNumber}`, this.pageWidth - this.margin - 50, footerY, {
        align: 'right'
      });
  }

  private addSectionTitle(title: string): void {
    this.checkPageBreak(40);
    
    // Add some spacing before the title
    this.currentY += 10;
    
    this.doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text(title, this.margin, this.currentY);
    
    this.currentY += 30;
    
    // Add a subtle underline
    this.doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(this.margin, this.currentY - 5)
      .lineTo(this.pageWidth - this.margin, this.currentY - 5)
      .stroke();
    
    this.currentY += 15;
  }

  private addCategoryTitle(category: string): void {
    this.checkPageBreak(30);
    
    const categoryTitle = category.replace(/_/g, ' ').toUpperCase();
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#2d3748')
      .text(categoryTitle, this.margin, this.currentY);
    
    this.currentY += 25;
  }

  private addTwoColumnData(leftData: Array<{label: string, value: string}>, rightData: Array<{label: string, value: string}>): void {
    this.checkPageBreak(30);
    
    // Simple approach: render left column first, then right column
    // PDFKit will handle text flow automatically
    
    // Left column
    leftData.forEach(item => {
      this.doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#4a5568')
        .text(`${item.label}:`, this.margin, this.currentY);
      
      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#2d3748')
        .text(item.value, this.margin + 120, this.currentY);
      
      this.currentY += 15;
    });
    
    // Right column - start at same Y as left column
    const rightColumnStartY = this.currentY - (leftData.length * 15);
    rightData.forEach((item, index) => {
      const yPos = rightColumnStartY + (index * 15);
      
      this.doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#4a5568')
        .text(`${item.label}:`, this.margin + 300, yPos);
      
      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#2d3748')
        .text(item.value, this.margin + 420, yPos);
    });
    
    this.currentY += 15;
  }

  private addFieldWithList(label: string, items: string[]): void {
    this.checkPageBreak(25);
    
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#4a5568')
      .text(label + ':', this.margin, this.currentY);
    
    this.currentY += 15;
    
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#2d3748')
      .text(items.join(', '), this.margin + 20, this.currentY, {
        width: this.contentWidth - 20
      });
    
    this.currentY += 20;
  }

  private addUsageData(usageData: any): void {
    this.checkPageBreak(25);
    
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#4a5568')
      .text('Usage Data:', this.margin, this.currentY);
    
    this.currentY += 15;
    
    const usageText = `Active Users: ${usageData.activeUsersCount || 'N/A'} | Seats Used: ${usageData.seatsUsed || 'N/A'} / ${usageData.seatsPurchased || 'N/A'}`;
    
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#2d3748')
      .text(usageText, this.margin + 20, this.currentY);
    
    this.currentY += 20;
  }

  private addInsightItem(insight: CustomerSuccessInsight): void {
    this.checkPageBreak(25);
    
    const severityColor = this.getSeverityColor(insight.severity);
    const typeText = insight.type.replace(/_/g, ' ').toUpperCase();
    
    // Insight type and severity - let PDFKit handle positioning
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(severityColor)
      .text(`• ${typeText} (${insight.severity.toUpperCase()})`, this.margin, this.currentY);
    
    this.currentY += 15;
    
    // Insight message - let PDFKit handle text wrapping
    this.doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#2d3748')
      .text(insight.message, this.margin + 20, this.currentY, {
        width: this.contentWidth - 20
      });
    
    this.currentY += 20;
  }


  private addRawContent(content: string): void {
    this.checkPageBreak(50);
    
    const cleanContent = this.cleanTextForPdf(content);
    
    // Use PDFKit's native text rendering - let it handle line flow automatically
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#4a5568')
      .text(cleanContent, this.margin, this.currentY, {
        width: this.contentWidth,
        align: 'left',
        lineGap: 5 // PDFKit's built-in line spacing
      });
    
    // Let PDFKit calculate the actual height used
    const textHeight = this.doc.heightOfString(cleanContent, {
      width: this.contentWidth,
      lineGap: 5
    });
    
    this.currentY += textHeight + 20;
  }
  
  // Removed renderLineWithColoredTags method - using PDFKit's native text rendering
  
  // Removed isSectionHeader method - using PDFKit's native text rendering

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'red': return '#e53e3e';
      case 'yellow': return '#d69e2e';
      case 'info': return '#3182ce';
      default: return '#4a5568';
    }
  }

  private getHealthScoreColor(score: number): string {
    if (score >= 8) return '#38a169'; // Green (8-10)
    if (score >= 6) return '#d69e2e'; // Yellow (6-7)
    if (score >= 4) return '#ed8936'; // Orange (4-5)
    return '#e53e3e'; // Red (0-3)
  }

  private getRiskColor(level: string): string {
    switch (level) {
      case 'critical': return '#e53e3e'; // Red
      case 'high': return '#ed8936'; // Orange
      case 'medium': return '#d69e2e'; // Yellow
      case 'low': return '#38a169'; // Green
      default: return '#4a5568'; // Gray
    }
  }

  /**
   * Basic text cleanup for PDF generation - minimal processing
   */
  private cleanTextForPdf(text: string): string {
    if (!text) return '';
    
    // Only remove problematic Unicode characters that PDFKit can't handle
    return text
      .replace(/[^\x00-\x7F\n]/g, '') // Remove non-ASCII characters except line breaks
      .trim();
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - 80) { // Increased bottom margin for footer
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private ensureNoEmptyPages(): void {
    // Check if the current page is mostly empty (less than 100px of content)
    if (this.currentY < this.margin + 100) {
      // If we're on a mostly empty page, we could remove it, but PDFKit doesn't support this easily
      // Instead, we'll just ensure the footer is properly positioned
      console.log('PDF: Current page appears to be mostly empty, ensuring proper footer placement');
    }
  }

  // Simplified PDF generation - using PDFKit's native formatting capabilities
}

export function generateMeetingPrepPdf(data: MeetingPrepData): any {
  const generator = new MeetingPrepPdfGenerator();
  return generator.generatePdf(data);
}
