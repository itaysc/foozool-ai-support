import { DocumentModel, IDocument } from '../../../schemas/document.schema';
import { IResponse } from '../../../types';
import { UserContextManager } from '../../../context/userContext';

export interface CreateDocumentRequest {
  title: string;
  content?: string; // Optional for folders
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
  
  // Folder structure fields
  folderPath?: string;        // e.g., "/Customer Meetings/Q4 2024/"
  parentFolderId?: string;    // For easier queries
  isFolder?: boolean;         // true for folders, false for documents
  folderName?: string;        // Only for folders
}

export async function createDocument(data: CreateDocumentRequest): Promise<IResponse> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    const userId = UserContextManager.getCurrentUserId();
    
    if (!organizationId) {
      return {
        status: 400,
        payload: { error: 'Organization ID not found in user context' },
      };
    }

    if (!userId) {
      return {
        status: 400,
        payload: { error: 'User ID not found in user context' },
      };
    }

    // Build folder path for documents (default to root if not specified)
    const folderPath = data.folderPath || '/';
    const isFolder = data.isFolder || false;
    
    // Find parent folder ID if folderPath is not root
    let parentFolderId: any = null;
    if (folderPath !== '/' && data.parentFolderId) {
      parentFolderId = data.parentFolderId;
    } else if (folderPath !== '/') {
      // Find parent folder by path
      const parentFolder = await DocumentModel.findOne({
        organizationId,
        folderPath: folderPath.substring(0, folderPath.lastIndexOf('/')) || '/',
        isFolder: true
      });
      parentFolderId = parentFolder?._id as any;
    }

    const document = new DocumentModel({
      organizationId,
      createdBy: userId,
      title: data.title,
      content: data.content || '', // Default to empty string for folders
      documentType: data.documentType || 'meeting_summary',
      customerId: data.customerId,
      meetingDate: data.meetingDate,
      meetingType: data.meetingType,
      duration: data.duration,
      attendees: data.attendees || [],
      notes: data.notes,
      keyPoints: data.keyPoints || [],
      customerSatisfactionScore: data.customerSatisfactionScore,
      tags: data.tags || [],
      sentiment: data.sentiment,
      
      // Folder structure fields
      folderPath,
      parentFolderId,
      isFolder,
      folderName: isFolder ? data.folderName || data.title : undefined,
      childrenCount: isFolder ? 0 : undefined,
      lastModified: isFolder ? new Date() : undefined,
    });

    const savedDocument = await document.save();

    // Update parent folder's children count if this is a document (not a folder)
    if (!isFolder && parentFolderId) {
      await DocumentModel.updateOne(
        { _id: parentFolderId },
        { 
          $inc: { childrenCount: 1 },
          lastModified: new Date()
        }
      );
    }

    return {
      status: 201,
      payload: savedDocument,
    };
  } catch (error) {
    console.error('Error creating document:', error);
    return {
      status: 500,
      payload: { error: 'Failed to create document' },
    };
  }
}

export async function getDocumentsByOrganization(): Promise<IResponse> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return {
        status: 400,
        payload: { error: 'Organization ID not found in user context' },
      };
    }

    const documents = await DocumentModel.find({ 
      organizationId,
      isFolder: false // Only return documents, not folders
    })
      .populate('customerId', 'name')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return {
      status: 200,
      payload: documents,
    };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return {
      status: 500,
      payload: { error: 'Failed to fetch documents' },
    };
  }
}

export async function getDocumentById(documentId: string): Promise<IResponse> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return {
        status: 400,
        payload: { error: 'Organization ID not found in user context' },
      };
    }

    const document = await DocumentModel.findOne({ 
      _id: documentId, 
      organizationId 
    })
      .populate('customerId', 'name')
      .populate('createdBy', 'firstName lastName email')
      .populate('actionItems.assignee', 'firstName lastName email')
      .lean();

    if (!document) {
      return {
        status: 404,
        payload: { error: 'Document not found' },
      };
    }

    return {
      status: 200,
      payload: document,
    };
  } catch (error) {
    console.error('Error fetching document:', error);
    return {
      status: 500,
      payload: { error: 'Failed to fetch document' },
    };
  }
}

export async function updateDocument(documentId: string, data: Partial<CreateDocumentRequest>): Promise<IResponse> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return {
        status: 400,
        payload: { error: 'Organization ID not found in user context' },
      };
    }

    const updatedDocument = await DocumentModel.findOneAndUpdate(
      { _id: documentId, organizationId },
      { ...data, updatedAt: new Date() },
      { new: true }
    )
      .populate('customerId', 'name')
      .populate('createdBy', 'firstName lastName email')
      .lean();

    if (!updatedDocument) {
      return {
        status: 404,
        payload: { error: 'Document not found' },
      };
    }

    return {
      status: 200,
      payload: updatedDocument,
    };
  } catch (error) {
    console.error('Error updating document:', error);
    return {
      status: 500,
      payload: { error: 'Failed to update document' },
    };
  }
}

export async function deleteDocument(documentId: string): Promise<IResponse> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return {
        status: 400,
        payload: { error: 'Organization ID not found in user context' },
      };
    }

    const deletedDocument = await DocumentModel.findOneAndDelete({
      _id: documentId,
      organizationId
    });

    if (!deletedDocument) {
      return {
        status: 404,
        payload: { error: 'Document not found' },
      };
    }

    // Update parent folder's children count if this was a document (not a folder)
    if (!deletedDocument.isFolder && deletedDocument.parentFolderId) {
      await DocumentModel.updateOne(
        { _id: deletedDocument.parentFolderId },
        { 
          $inc: { childrenCount: -1 },
          lastModified: new Date()
        }
      );
    }

    return {
      status: 200,
      payload: { message: 'Document deleted successfully' },
    };
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      status: 500,
      payload: { error: 'Failed to delete document' },
    };
  }
}
