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
    this.addHeader(data.customer.name, data.generatedAt);
    this.addCustomerProfile(data.customer);
    this.addHealthScore(data.healthScore);
    this.addRiskAssessment(data.riskAssessment);
    this.addCustomerNews(data.customerNews);
    this.addInsights(data.insights);
    this.addDocumentContent(data.documentContent);
    this.addFooter(data.generatedBy);

    // Ensure no empty pages at the end
    this.ensureNoEmptyPages();

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
      .text(`Overall Health Score: ${healthScore.overallScore}/100`, this.margin, this.currentY);
    
    this.currentY += 20;

    // Health score breakdown
    const healthData = [
      { label: 'Support Health', score: healthScore.supportHealth.score, color: this.getHealthScoreColor(healthScore.supportHealth.score) },
      { label: 'Engagement Health', score: healthScore.engagementHealth.score, color: this.getHealthScoreColor(healthScore.engagementHealth.score) },
      { label: 'Business Health', score: healthScore.businessHealth.score, color: this.getHealthScoreColor(healthScore.businessHealth.score) }
    ];

    healthData.forEach(item => {
      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#4a5568')
        .text(`${item.label}:`, this.margin, this.currentY);
      
      this.doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(item.color)
        .text(`${item.score}/100`, this.margin + 120, this.currentY);
      
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

        // Evidence
        if (riskItem.risk.evidence.length > 0) {
          this.doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#4a5568')
            .text('Evidence:', this.margin + 20, this.currentY);
          
          this.currentY += 12;
          
          riskItem.risk.evidence.forEach(evidence => {
            this.doc
              .fontSize(8)
              .font('Helvetica')
              .fillColor('#718096')
              .text(`• ${evidence}`, this.margin + 30, this.currentY, {
                width: this.contentWidth - 30
              });
            this.currentY += 12;
          });
        }

        // Recommendations
        if (riskItem.risk.recommendations.length > 0) {
          this.doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#2d3748')
            .text('Recommended Actions:', this.margin + 20, this.currentY);
          
          this.currentY += 12;
          
          riskItem.risk.recommendations.slice(0, 3).forEach(rec => {
            this.doc
              .fontSize(8)
              .font('Helvetica')
              .fillColor('#4a5568')
              .text(`• ${rec}`, this.margin + 30, this.currentY, {
                width: this.contentWidth - 30
              });
            this.currentY += 12;
          });
        }

        this.currentY += 10;
      }
    });
  }

  private addCustomerNews(customerNews?: NewsResult): void {
    console.log('PDF: addCustomerNews called with:', {
      hasCustomerNews: !!customerNews,
      hasNewsArray: !!customerNews?.news,
      newsLength: customerNews?.news?.length || 0,
      hasSummary: !!customerNews?.summary,
      hasActionItems: !!customerNews?.actionItems,
      actionItemsLength: customerNews?.actionItems?.length || 0
    });

    // Always add the section title, even if no news
    this.addSectionTitle('Recent Company News');

    if (!customerNews || !customerNews.news || customerNews.news.length === 0) {
      console.log('PDF: No customer news to display - showing fallback message');
      
      this.doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#718096')
        .text('No recent news items found for this customer. This could be due to:', this.margin, this.currentY, {
          width: this.contentWidth
        });
      
      this.currentY += 15;
      
      this.doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#a0aec0')
        .text('• Customer name not available for news search', this.margin + 20, this.currentY);
      
      this.currentY += 12;
      
      this.doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#a0aec0')
        .text('• No recent news articles found', this.margin + 20, this.currentY);
      
      this.currentY += 12;
      
      this.doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#a0aec0')
        .text('• News service temporarily unavailable', this.margin + 20, this.currentY);
      
      this.currentY += 20;
      return;
    }

    console.log('PDF: Adding customer news section with', customerNews.news.length, 'items');

    // News summary
    if (customerNews.summary) {
      this.doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#2d3748')
        .text('Summary:', this.margin, this.currentY);
      
      this.currentY += 15;
      
      this.doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#4a5568')
        .text(this.cleanTextForPdf(customerNews.summary), this.margin, this.currentY, {
          width: this.contentWidth
        });
      
      this.currentY += 20;
    }

    // Individual news items
    const relevantNews = customerNews.news.filter(item => 
      item.relevance === 'high' || item.relevance === 'medium'
    ).slice(0, 5); // Limit to top 5 most relevant items

    if (relevantNews.length > 0) {
      this.doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#2d3748')
        .text('Key News Items:', this.margin, this.currentY);
      
      this.currentY += 15;

      relevantNews.forEach((item, index) => {
        this.checkPageBreak(60);
        
        // News title
        this.doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1a365d')
          .text(`${index + 1}. ${this.cleanTextForPdf(item.title)}`, this.margin, this.currentY, {
            width: this.contentWidth
          });
        
        this.currentY += 15;

        // News metadata (date, source, relevance, impact)
        const metadata = [
          `Date: ${new Date(item.pubDate).toLocaleDateString()}`,
          `Source: ${item.source}`,
          `Relevance: ${item.relevance.toUpperCase()}`,
          `Impact: ${item.impact.toUpperCase()}`
        ].join(' | ');

        this.doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#718096')
          .text(metadata, this.margin, this.currentY);
        
        this.currentY += 12;

        // News summary or content snippet
        const content = item.summary || item.contentSnippet || item.content;
        if (content) {
          const truncatedContent = content.length > 200 ? content.substring(0, 200) + '...' : content;
          
          this.doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#4a5568')
            .text(this.cleanTextForPdf(truncatedContent), this.margin, this.currentY, {
              width: this.contentWidth
            });
          
          this.currentY += 20;
        }

        // Categories if available
        if (item.categories && item.categories.length > 0) {
          this.doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#805ad5')
            .text(`Categories: ${item.categories.join(', ')}`, this.margin, this.currentY);
          
          this.currentY += 15;
        }

        this.currentY += 10;
      });
    }

    // Action items from news if available
    if (customerNews.actionItems && customerNews.actionItems.length > 0) {
      this.doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#2d3748')
        .text('News-Based Action Items:', this.margin, this.currentY);
      
      this.currentY += 15;

      customerNews.actionItems.slice(0, 3).forEach((actionItem, index) => {
        this.checkPageBreak(40);
        
        const priorityColor = actionItem.priority === 'high' ? '#e53e3e' : 
                             actionItem.priority === 'medium' ? '#dd6b20' : '#38a169';
        
        this.doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(priorityColor)
          .text(`${index + 1}. [${actionItem.priority.toUpperCase()}] ${this.cleanTextForPdf(actionItem.title)}`, this.margin, this.currentY);
        
        this.currentY += 12;
        
        this.doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#4a5568')
          .text(this.cleanTextForPdf(actionItem.description), this.margin, this.currentY, {
            width: this.contentWidth
          });
        
        this.currentY += 15;
      });
    }
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

    // Parse the content into sections
    const sections = this.parseDocumentSections(content);
    
    console.log('PDF: Parsed sections count:', sections.length);
    sections.forEach((section, index) => {
      console.log(`PDF: Section ${index + 1}: "${section.title}" (${section.content.length} chars)`);
    });
    
    if (sections.length > 0) {
      sections.forEach(section => {
        this.addDocumentSection(section.title, section.content);
      });
    } else {
      // Fallback: if parsing fails, show the raw content
      console.log('PDF: No sections parsed, using raw content fallback');
      this.addRawContent(content);
    }
  }

  private addFooter(generatedBy: string): void {
    // Ensure we have enough space for footer
    this.checkPageBreak(40);
    
    const footerY = this.currentY + 20;
    
    this.doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#718096')
      .text(`Generated by ${generatedBy}`, this.margin, footerY, {
        align: 'left'
      })
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
    
    const columnWidth = (this.contentWidth - 20) / 2;
    const startY = this.currentY;
    const labelWidth = 100; // Fixed width for labels to prevent overlap
    const valueStartX = this.margin + labelWidth + 10; // 10px gap between label and value

    // Left column
    leftData.forEach((item, index) => {
      const yPos = startY + (index * 15);
      
      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#4a5568')
        .text(item.label + ':', this.margin, yPos, { width: labelWidth });
      
      this.doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#2d3748')
        .text(item.value, valueStartX, yPos, { width: columnWidth - labelWidth - 10 });
    });

    // Right column
    const rightColumnStartX = this.margin + columnWidth + 20;
    rightData.forEach((item, index) => {
      const yPos = startY + (index * 15);
      
      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#4a5568')
        .text(item.label + ':', rightColumnStartX, yPos, { width: labelWidth });
      
      this.doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#2d3748')
        .text(item.value, rightColumnStartX + labelWidth + 10, yPos, { width: columnWidth - labelWidth - 10 });
    });

    this.currentY = startY + (Math.max(leftData.length, rightData.length) * 15) + 15;
  }

  private addFieldWithList(label: string, items: string[]): void {
    this.checkPageBreak(25);
    
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#4a5568')
      .text(label + ':', this.margin, this.currentY);
    
    this.currentY += 15;
    
    this.doc
      .fontSize(10)
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
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#4a5568')
      .text('Usage Data:', this.margin, this.currentY);
    
    this.currentY += 15;
    
    const usageText = `Active Users: ${usageData.activeUsersCount || 'N/A'} | Seats Used: ${usageData.seatsUsed || 'N/A'} / ${usageData.seatsPurchased || 'N/A'}`;
    
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#2d3748')
      .text(usageText, this.margin + 20, this.currentY);
    
    this.currentY += 20;
  }

  private addInsightItem(insight: CustomerSuccessInsight): void {
    this.checkPageBreak(25);
    
    const severityColor = this.getSeverityColor(insight.severity);
    const typeText = insight.type.replace(/_/g, ' ').toUpperCase();
    
    // Insight type and severity
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(severityColor)
      .text(`• ${typeText} (${insight.severity.toUpperCase()})`, this.margin, this.currentY);
    
    this.currentY += 15;
    
    // Insight message
    this.doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#2d3748')
      .text(insight.message, this.margin + 20, this.currentY, {
        width: this.contentWidth - 20
      });
    
    this.currentY += 20;
  }

  private addDocumentSection(title: string, content: string): void {
    this.checkPageBreak(40);
    
    // Section title (clean for PDF) - make it more prominent
    const cleanTitle = this.cleanTextForPdf(title);
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text(cleanTitle, this.margin, this.currentY);
    
    this.currentY += 25;
    
    // Add a subtle line under the title
    this.doc
      .strokeColor('#e2e8f0')
      .lineWidth(0.5)
      .moveTo(this.margin, this.currentY - 5)
      .lineTo(this.pageWidth - this.margin, this.currentY - 5)
      .stroke();
    
    this.currentY += 15;
    
    // Section content (clean for PDF)
    const cleanContent = this.cleanTextForPdf(content);
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#4a5568')
      .text(cleanContent, this.margin, this.currentY, {
        width: this.contentWidth,
        align: 'justify'
      });
    
    this.currentY += this.doc.heightOfString(cleanContent, {
      width: this.contentWidth
    }) + 20;
  }

  private parseDocumentSections(content: string): Array<{title: string, content: string}> {
    const sections: Array<{title: string, content: string}> = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: '' };
    
    console.log('PDF: Parsing document sections, total lines:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Enhanced section header detection for the new format
      const isSectionHeader = 
        // Numbered sections (1. CRITICAL RISK ALERTS) - prioritize this format
        trimmedLine.match(/^\d+\.\s+[A-Z\s]+/) ||
        // New format with brackets [CRITICAL] CRITICAL RISK ALERTS
        trimmedLine.match(/^\[[A-Z\s]+\]\s+[A-Z\s]+/) ||
        // All caps sections (EXECUTIVE SUMMARY)
        (trimmedLine.length > 3 && trimmedLine === trimmedLine.toUpperCase() && trimmedLine.match(/^[A-Z\s]+$/)) ||
        // Bold sections (**EXECUTIVE SUMMARY**)
        trimmedLine.match(/^\*\*[A-Z\s]+\*\*$/) ||
        // Hash sections (# EXECUTIVE SUMMARY)
        trimmedLine.match(/^#\s+[A-Z\s]+$/);
      
      if (isSectionHeader) {
        console.log(`PDF: Found section header at line ${i}: "${trimmedLine}"`);
        
        // Save previous section if it exists
        if (currentSection.title) {
          sections.push({ ...currentSection });
          console.log(`PDF: Saved section: "${currentSection.title}"`);
        }
        
        // Clean up the title (remove markdown formatting and brackets)
        let cleanTitle = trimmedLine
          .replace(/^\d+\.\s+/, '') // Remove numbering first
          .replace(/^\[[A-Z\s]+\]\s+/, '') // Remove [CRITICAL] prefix
          .replace(/^\*\*/, '').replace(/\*\*$/, '') // Remove bold markers
          .replace(/^#\s+/, '') // Remove hash
          .trim();
        
        console.log(`PDF: Clean title: "${cleanTitle}"`);
        
        // Start new section
        currentSection = {
          title: cleanTitle,
          content: ''
        };
      } else {
        // Add content to current section (or start first section if no header found)
        if (!currentSection.title && sections.length === 0) {
          currentSection.title = 'Meeting Preparation Content';
        }
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }
    
    // Add the last section
    if (currentSection.title) {
      sections.push(currentSection);
      console.log(`PDF: Saved final section: "${currentSection.title}"`);
    }
    
    console.log('PDF: Total sections parsed:', sections.length);
    return sections;
  }

  private addRawContent(content: string): void {
    this.checkPageBreak(50);
    
    const cleanContent = this.cleanTextForPdf(content);
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#4a5568')
      .text(cleanContent, this.margin, this.currentY, {
        width: this.contentWidth,
        align: 'left'
      });
    
    this.currentY += this.doc.heightOfString(cleanContent, {
      width: this.contentWidth
    }) + 20;
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'red': return '#e53e3e';
      case 'yellow': return '#d69e2e';
      case 'info': return '#3182ce';
      default: return '#4a5568';
    }
  }

  private getHealthScoreColor(score: number): string {
    if (score >= 80) return '#38a169'; // Green
    if (score >= 60) return '#d69e2e'; // Yellow
    if (score >= 40) return '#ed8936'; // Orange
    return '#e53e3e'; // Red
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
   * Clean text for PDF generation by replacing emojis and special characters
   */
  private cleanTextForPdf(text: string): string {
    if (!text) return '';
    
    return text
      // Replace emojis with text equivalents
      .replace(/🚨/g, '[CRITICAL]')
      .replace(/⚠️/g, '[WARNING]')
      .replace(/🔄/g, '[CHURN]')
      .replace(/😞/g, '[SATISFACTION]')
      .replace(/📞/g, '[ENGAGEMENT]')
      .replace(/📰/g, '[NEWS]')
      .replace(/📊/g, '[HEALTH]')
      .replace(/💬/g, '[TALKING POINTS]')
      .replace(/📋/g, '[ACTIONS]')
      .replace(/❓/g, '[QUESTIONS]')
      .replace(/🎯/g, '[OPPORTUNITIES]')
      .replace(/📈/g, '[METRICS]')
      .replace(/🔄/g, '[FOLLOW-UP]')
      .replace(/💎/g, '[HIGH VALUE]')
      .replace(/✅/g, '[EXCELLENT]')
      .replace(/👍/g, '[GOOD]')
      .replace(/🔍/g, '[INSIGHTS]')
      .replace(/🚀/g, '[GROWTH]')
      .replace(/💻/g, '[USAGE]')
      .replace(/🏥/g, '[HEALTH SCORE]')
      .replace(/🔍/g, '[RISK ASSESSMENT]')
      // Remove any remaining problematic Unicode characters
      .replace(/[^\x00-\x7F]/g, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
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
}

export function generateMeetingPrepPdf(data: MeetingPrepData): any {
  const generator = new MeetingPrepPdfGenerator();
  return generator.generatePdf(data);
}
