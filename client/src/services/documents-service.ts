import axios from '@/services/axios';
import config from '@/config';

const getRoute = (endpoint: string) => `${config.apiUrl}/${endpoint}`;

export interface CreateDocumentRequest {
  title: string;
  content?: string; // Optional for folders and link documents
  documentType?: 'meeting_summary' | 'note' | 'report' | 'other' | 'link' | 'google_doc';
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
  
  // Link document fields
  linkUrl?: string;
  linkDescription?: string;
  
  // Google Doc fields
  googleDocId?: string;
  googleDocUrl?: string;
  
  // Folder structure fields
  folderPath?: string;        // e.g., "/Customer Meetings/Q4 2024/"
  parentFolderId?: string;    // For easier queries
  isFolder?: boolean;         // true for folders, false for documents
  folderName?: string;        // Only for folders
}

export interface IDocument {
  _id: string;
  organizationId: string;
  customerId?: string;
  createdBy: string;
  title: string;
  content?: string; // Optional for folders and link documents
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
  
  // Link document fields
  linkUrl?: string;
  linkDescription?: string;
  
  // Google Doc fields
  googleDocId?: string;
  googleDocUrl?: string;
  
  // Folder structure fields
  folderPath: string;        // e.g., "/Customer Meetings/Q4 2024/"
  parentFolderId?: string;   // For easier queries
  isFolder: boolean;         // true for folders, false for documents
  folderName?: string;       // Only for folders
  
  // Metadata for folders
  childrenCount?: number;    // Number of items in folder
  lastModified?: Date;       // When folder contents were last modified
  
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

  // Folder management methods
  async createFolder(folderName: string, parentFolderPath: string = '/'): Promise<IDocument> {
    const response = await axios.post(getRoute('docs/folders'), {
      folderName,
      folderPath: parentFolderPath, // Let server build the final path
      isFolder: true,
      title: folderName,
      content: '', // Empty content for folders
      documentType: 'other'
    });
    return response.data;
  },

  async getFolderContents(folderPath: string = '/', parentFolderId?: string | null): Promise<IDocument[]> {
    const url = getRoute(`docs/folders${folderPath === '/' ? '' : `/${encodeURIComponent(folderPath)}`}`);
    const params = new URLSearchParams();
    if (parentFolderId !== undefined) {
      params.append('parentFolderId', parentFolderId || 'null');
    }
    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
    const response = await axios.get(fullUrl);
    return response.data;
  },

  async getFolderTree(): Promise<IDocument[]> {
    const response = await axios.get(getRoute('docs/folders/tree'));
    return response.data;
  },

  async renameFolder(folderId: string, newName: string): Promise<IDocument> {
    const response = await axios.put(getRoute(`docs/folders/${folderId}`), {
      folderName: newName,
      title: newName
    });
    return response.data;
  },

  async deleteFolder(folderId: string): Promise<void> {
    await axios.delete(getRoute(`docs/folders/${folderId}`));
  },

  async moveItem(itemId: string, newFolderPath: string): Promise<IDocument> {
    const response = await axios.post(getRoute(`docs/${itemId}/move`), {
      folderPath: newFolderPath
    });
    return response.data;
  },

  async analyzeDocument(documentId: string): Promise<{ message: string; analysis?: any }> {
    const response = await axios.post(getRoute(`docs/${documentId}/analyze`));
    return response.data;
  },
};

export default documentsService;

