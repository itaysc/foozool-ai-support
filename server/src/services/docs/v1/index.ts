import { DocumentModel, IDocument } from '../../../schemas/document.schema';
import { IResponse } from '../../../types';
import { UserContextManager } from '../../../context/userContext';
import documentAnalysisService from '../../document-analysis';
import { generateDocumentInsights } from '../../insights/documentInsights.service';
import { InsightModel } from '../../../schemas/insights.schema';
import mongoose from 'mongoose';

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
      content: data.content || '', // Default to empty string for folders and link documents
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
      
      // Link document fields
      linkUrl: data.linkUrl,
      linkDescription: data.linkDescription,
      
      // Google Doc fields
      googleDocId: data.googleDocId,
      googleDocUrl: data.googleDocUrl,
      
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

export async function analyzeDocument(documentId: string): Promise<IResponse> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return {
        status: 400,
        payload: { error: 'Organization ID not found in user context' },
      };
    }

    // Find the document
    const document = await DocumentModel.findOne({
      _id: documentId,
      organizationId,
      isFolder: false // Only analyze documents, not folders
    });

    if (!document) {
      return {
        status: 404,
        payload: { error: 'Document not found or is a folder' },
      };
    }

    // Check if document has content
    if (!document.content || document.content.trim().length === 0) {
      return {
        status: 400,
        payload: { error: 'Document has no content to analyze' },
      };
    }

    console.log(`🔍 Starting manual analysis for document: ${document.title}`);
    
    // Perform the analysis
    const analysisResult = await documentAnalysisService.analyzeSingleDocument(document);
    
    if (analysisResult.autoClassification) {
      // Update the document with analysis results
      const updateSuccess = await documentAnalysisService.updateDocumentWithAnalysis(documentId, analysisResult);
      
      if (updateSuccess) {
        console.log(`✅ Manual analysis completed for document: ${document.title}`);
        
        // Generate insights from the analysis if document has a customer
        let insightsCreated = 0;
        if (document.customerId) {
          try {
            console.log(`🎯 Generating insights for customer: ${document.customerId}`);
            
            // Get customer name for better insight context
            const { CustomerModel } = await import('../../../schemas');
            const customer = await CustomerModel.findOne({ 
              _id: document.customerId, 
              organizationId 
            }).select('name').lean();
            
            const customerName = customer?.name;
            
            // Generate document-based insights
            const documentInsights = generateDocumentInsights(document, analysisResult, customerName);
            
            // Create insights in the database
            for (const insight of documentInsights) {
              const clusterId = `document_${documentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              const insightData = {
                clusterId,
                organizationId: new mongoose.Types.ObjectId(organizationId),
                insightType: 'customer_success',
                issueDescription: insight.message,
                ticketVolume: 0, // Not applicable for document insights
                growthRate: 0, // Not applicable for document insights
                firstDetectedAt: new Date(),
                lastUpdatedAt: new Date(),
                customerId: new mongoose.Types.ObjectId(document.customerId),
                customerName: customerName,
                assignee: insight.assignee ? new mongoose.Types.ObjectId(insight.assignee) : undefined,
                status: insight.status || 'new',
                metadata: {
                  type: insight.type,
                  severity: insight.severity,
                  category: insight.category,
                  meta: insight.meta,
                  guidance: insight.guidance,
                  source: 'document_analysis',
                  documentId: document._id,
                  documentTitle: document.title,
                  analysisConfidence: analysisResult.autoClassification.confidence
                }
              };
              
              const savedInsight = await InsightModel.findOneAndUpdate(
                {
                  organizationId: new mongoose.Types.ObjectId(organizationId),
                  customerId: new mongoose.Types.ObjectId(document.customerId),
                  insightType: 'customer_success',
                  clusterId: clusterId
                },
                insightData,
                { upsert: true, new: true }
              );
              
              // Assign insight number if not already assigned
              if (!savedInsight.insightNumber) {
                const { assignInsightNumberAtomic } = await import('../../insights/insightNumber.service');
                await assignInsightNumberAtomic(savedInsight._id as any);
              }
              
              insightsCreated++;
            }
            
            console.log(`✅ Created ${insightsCreated} insights for customer: ${customerName || document.customerId}`);
            
          } catch (insightError: any) {
            console.error(`❌ Error creating insights for document ${document.title}:`, insightError.message);
            // Don't fail the analysis if insight creation fails
          }
        }
        
        return {
          status: 200,
          payload: { 
            message: 'Document analysis completed successfully',
            analysis: analysisResult.autoClassification,
            insightsCreated: insightsCreated
          },
        };
      } else {
        return {
          status: 500,
          payload: { error: 'Failed to save analysis results' },
        };
      }
    } else {
      return {
        status: 500,
        payload: { error: 'Analysis failed to produce results' },
      };
    }

  } catch (error: any) {
    console.error('Error analyzing document:', error);
    return {
      status: 500,
      payload: { error: `Failed to analyze document: ${error.message}` },
    };
  }
}
