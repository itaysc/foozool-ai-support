import PDFDocument from 'pdfkit';
import { CustomerSuccessInsight } from '../insights/customerSuccess.service';

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
      }
    });
  }

  generatePdf(data: MeetingPrepData): any {
    this.addHeader(data.customer.name, data.generatedAt);
    this.addCustomerProfile(data.customer);
    this.addInsights(data.insights);
    this.addDocumentContent(data.documentContent);
    this.addFooter(data.generatedBy);

    return this.doc;
  }

  private addHeader(customerName: string, generatedAt: Date): void {
    // Title
    this.doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('Customer Meeting Preparation', this.margin, this.margin, {
        align: 'center'
      });

    this.currentY = this.margin + 40;

    // Customer name
    this.doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#2d3748')
      .text(customerName, this.margin, this.currentY, {
        align: 'center'
      });

    this.currentY += 30;

    // Generated date
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#718096')
      .text(`Generated on ${generatedAt.toLocaleDateString()} at ${generatedAt.toLocaleTimeString()}`, this.margin, this.currentY, {
        align: 'center'
      });

    this.currentY += 40;

    // Divider line
    this.doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(this.margin, this.currentY)
      .lineTo(this.pageWidth - this.margin, this.currentY)
      .stroke();

    this.currentY += 20;
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
    const footerY = this.pageHeight - 60;
    
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
    this.checkPageBreak(30);
    
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#2d3748')
      .text(title, this.margin, this.currentY);
    
    this.currentY += 25;
  }

  private addCategoryTitle(category: string): void {
    this.checkPageBreak(25);
    
    const categoryTitle = category.replace(/_/g, ' ').toUpperCase();
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#4a5568')
      .text(categoryTitle, this.margin, this.currentY);
    
    this.currentY += 20;
  }

  private addTwoColumnData(leftData: Array<{label: string, value: string}>, rightData: Array<{label: string, value: string}>): void {
    this.checkPageBreak(30);
    
    const columnWidth = (this.contentWidth - 20) / 2;
    const startY = this.currentY;

    // Left column
    leftData.forEach((item, index) => {
      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#4a5568')
        .text(item.label + ':', this.margin, startY + (index * 15));
      
      this.doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#2d3748')
        .text(item.value, this.margin + 80, startY + (index * 15));
    });

    // Right column
    rightData.forEach((item, index) => {
      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#4a5568')
        .text(item.label + ':', this.margin + columnWidth + 20, startY + (index * 15));
      
      this.doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#2d3748')
        .text(item.value, this.margin + columnWidth + 100, startY + (index * 15));
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
    this.checkPageBreak(30);
    
    // Section title
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#2d3748')
      .text(title, this.margin, this.currentY);
    
    this.currentY += 20;
    
    // Section content
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#4a5568')
      .text(content, this.margin, this.currentY, {
        width: this.contentWidth,
        align: 'justify'
      });
    
    this.currentY += this.doc.heightOfString(content, {
      width: this.contentWidth
    }) + 15;
  }

  private parseDocumentSections(content: string): Array<{title: string, content: string}> {
    const sections: Array<{title: string, content: string}> = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: '' };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // More flexible section header detection
      const isSectionHeader = 
        // Numbered sections (1. EXECUTIVE SUMMARY)
        trimmedLine.match(/^\d+\.\s+[A-Z\s]+$/) ||
        // All caps sections (EXECUTIVE SUMMARY)
        (trimmedLine.length > 3 && trimmedLine === trimmedLine.toUpperCase() && trimmedLine.match(/^[A-Z\s]+$/)) ||
        // Bold sections (**EXECUTIVE SUMMARY**)
        trimmedLine.match(/^\*\*[A-Z\s]+\*\*$/) ||
        // Hash sections (# EXECUTIVE SUMMARY)
        trimmedLine.match(/^#\s+[A-Z\s]+$/);
      
      if (isSectionHeader) {
        // Save previous section if it exists
        if (currentSection.title) {
          sections.push({ ...currentSection });
        }
        
        // Clean up the title (remove markdown formatting)
        let cleanTitle = trimmedLine
          .replace(/^\d+\.\s+/, '') // Remove numbering
          .replace(/^\*\*/, '').replace(/\*\*$/, '') // Remove bold markers
          .replace(/^#\s+/, '') // Remove hash
          .trim();
        
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
    }
    
    return sections;
  }

  private addRawContent(content: string): void {
    this.checkPageBreak(50);
    
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#4a5568')
      .text(content, this.margin, this.currentY, {
        width: this.contentWidth,
        align: 'left'
      });
    
    this.currentY += this.doc.heightOfString(content, {
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

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - 50) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }
}

export function generateMeetingPrepPdf(data: MeetingPrepData): any {
  const generator = new MeetingPrepPdfGenerator();
  return generator.generatePdf(data);
}
