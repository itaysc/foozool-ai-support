import axios from '@/services/axios';
import config from '@/config';

const getRoute = (endpoint: string) => `${config.apiUrl}/${endpoint}`;

export interface CreateDocumentRequest {
  title: string;
  content: string;
  documentType?: 'meeting_summary' | 'note' | 'report' | 'other';
  customerId?: string;
  meetingDate?: Date;
  meetingType?: 'customer_facing' | 'internal' | 'check_in' | 'escalation' | 'onboarding' | 'renewal' | 'other';
  duration?: number;
  attendees?: string[];
  notes?: string;
  keyPoints?: string[];
  customerSatisfactionScore?: number;
  tags?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface IDocument {
  _id: string;
  organizationId: string;
  customerId?: string;
  createdBy: string;
  title: string;
  content: string;
  documentType: string;
  meetingDate?: Date;
  meetingType?: string;
  duration?: number;
  attendees: string[];
  notes?: string;
  keyPoints: string[];
  customerSatisfactionScore?: number;
  tags: string[];
  sentiment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const documentsService = {
  async createDocument(data: CreateDocumentRequest): Promise<IDocument> {
    const response = await axios.post(getRoute('docs'), data);
    return response.data;
  },

  async getDocuments(): Promise<IDocument[]> {
    const response = await axios.get(getRoute('docs'));
    return response.data;
  },

  async getDocumentById(id: string): Promise<IDocument> {
    const response = await axios.get(getRoute(`docs/${id}`));
    return response.data;
  },

  async updateDocument(id: string, data: Partial<CreateDocumentRequest>): Promise<IDocument> {
    const response = await axios.put(getRoute(`docs/${id}`), data);
    return response.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await axios.delete(getRoute(`docs/${id}`));
  },
};

export default documentsService;

