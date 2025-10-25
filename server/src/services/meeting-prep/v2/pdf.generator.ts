import { generateMeetingPrepPdf, MeetingPrepData } from '../../pdf/meetingPrepPdf.service';

/**
 * Convert PDFKit document to buffer
 */
export async function pdfDocToBuffer(pdfDoc: any): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    pdfDoc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    pdfDoc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    pdfDoc.on('error', (error: Error) => {
      reject(error);
    });
    
    // End the document to trigger the stream
    pdfDoc.end();
  });
}

/**
 * Generate PDF and convert to buffer
 */
export async function generatePdfBuffer(data: MeetingPrepData): Promise<Buffer> {
  console.log('📄 Starting PDF generation...');
  const pdfDoc = generateMeetingPrepPdf(data);
  console.log('📄 PDF generation completed successfully');
  
  console.log('📄 Converting PDF document to buffer...');
  const pdfBuffer = await pdfDocToBuffer(pdfDoc);
  console.log('📄 PDF document converted to buffer successfully');
  
  return pdfBuffer;
}

/**
 * Generate filename for meeting prep document
 */
export function generateFilename(customerName: string): string {
  return `meeting-prep-${customerName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
}
