import { DocumentModel, IDocument } from '../../schemas/document.schema';
import { 
    analyzeDocument, 
    classifyDocumentCategory, 
    extractDocumentTopics,
    DocumentAnalysisRequest,
    DocumentAnalysisResult 
} from '../call-python';

export class DocumentAnalysisService {
    
    /**
     * Analyze a single document using ML models
     * Step 1: Pre-classification (fast, low-token)
     * Step 2: Selective deep analysis (only on relevant documents)
     */
    async analyzeSingleDocument(document: IDocument): Promise<Partial<IDocument>> {
        try {
            console.log(`🔍 Analyzing document: ${document.title}`);
            
            // Skip folders and documents without content
            if (document.isFolder || !document.content) {
                console.log(`⏭️ Skipping folder or empty document: ${document.title}`);
                return {};
            }

            // Prepare document for analysis
            const analysisRequest: DocumentAnalysisRequest = {
                title: document.title,
                content: this.extractTextFromContent(document.content),
                documentType: document.documentType || 'note',
                mimeType: this.getMimeTypeFromDocument(document)
            };

            // Call Python ML service for analysis
            const analysisResult = await analyzeDocument(analysisRequest);
            
            console.log(`✅ Document analysis completed for: ${document.title}`);
            console.log(`📊 Category: ${analysisResult.category}, Confidence: ${analysisResult.confidence}`);
            
            // Return the auto-classification data to be saved
            return {
                autoClassification: {
                    category: analysisResult.category,
                    topics: analysisResult.topics,
                    sentiment: analysisResult.sentiment,
                    businessRelevance: analysisResult.businessRelevance,
                    keyEntities: analysisResult.keyEntities,
                    summary: analysisResult.summary,
                    confidence: analysisResult.confidence,
                    analyzedAt: new Date()
                }
            };

        } catch (error: any) {
            console.error(`❌ Error analyzing document ${document.title}:`, error.message);
            
            // Return default classification on error
            return {
                autoClassification: {
                    category: 'unknown',
                    topics: [],
                    sentiment: 'neutral',
                    businessRelevance: 0.5,
                    keyEntities: {
                        people: [],
                        companies: [],
                        products: [],
                        locations: []
                    },
                    summary: 'Analysis failed - unable to process document',
                    confidence: 0.0,
                    analyzedAt: new Date()
                }
            };
        }
    }

    /**
     * Batch analyze multiple documents efficiently
     * Uses pre-classification to filter relevant documents
     */
    async batchAnalyzeDocuments(documents: IDocument[]): Promise<Map<string, Partial<IDocument>>> {
        const results = new Map<string, Partial<IDocument>>();
        
        try {
            console.log(`🔍 Starting batch analysis of ${documents.length} documents`);
            
            // Filter out folders and empty documents
            const validDocuments = documents.filter(doc => 
                !doc.isFolder && doc.content && doc.content.trim().length > 0
            );
            
            console.log(`📝 ${validDocuments.length} valid documents for analysis`);
            
            if (validDocuments.length === 0) {
                return results;
            }

            // Step 1: Pre-classification (fast, low-token)
            const analysisRequests: DocumentAnalysisRequest[] = validDocuments.map(doc => ({
                title: doc.title,
                content: this.extractTextFromContent(doc.content!),
                documentType: doc.documentType || 'note',
                mimeType: this.getMimeTypeFromDocument(doc)
            }));

            console.log(`🚀 Running pre-classification on ${analysisRequests.length} documents`);
            
            // Batch classify documents to identify relevant ones
            const categories = await classifyDocumentCategory(analysisRequests);
            
            // Step 2: Selective deep analysis
            const relevantDocuments = validDocuments.filter((doc, index) => {
                const category = categories[index];
                return this.isRelevantForDeepAnalysis(category, doc);
            });
            
            console.log(`🎯 ${relevantDocuments.length} documents selected for deep analysis`);
            
            // Perform deep analysis on relevant documents only
            for (const document of relevantDocuments) {
                const analysisResult = await this.analyzeSingleDocument(document);
                results.set((document._id as any).toString(), analysisResult);
            }
            
            console.log(`✅ Batch analysis completed. ${results.size} documents analyzed`);
            
        } catch (error: any) {
            console.error(`❌ Error in batch document analysis:`, error.message);
        }
        
        return results;
    }

    /**
     * Update document in database with analysis results
     */
    async updateDocumentWithAnalysis(documentId: string, analysisData: Partial<IDocument>): Promise<boolean> {
        try {
            await DocumentModel.findByIdAndUpdate(
                documentId,
                { $set: analysisData },
                { new: true }
            );
            
            console.log(`✅ Updated document ${documentId} with analysis results`);
            return true;
            
        } catch (error: any) {
            console.error(`❌ Error updating document ${documentId}:`, error.message);
            return false;
        }
    }

    /**
     * Get documents that need analysis (new or unanalyzed)
     */
    async getDocumentsNeedingAnalysis(organizationId: string, limit: number = 100): Promise<IDocument[]> {
        try {
            const documents = await DocumentModel.find({
                organizationId,
                isFolder: false,
                content: { $exists: true, $nin: [null, ''] },
                $or: [
                    { 'autoClassification': { $exists: false } },
                    { 'autoClassification.analyzedAt': { $exists: false } },
                    { 'autoClassification.confidence': { $lt: 0.7 } } // Re-analyze low confidence
                ]
            })
            .limit(limit)
            .sort({ createdAt: -1 }); // Most recent first
            
            console.log(`📋 Found ${documents.length} documents needing analysis`);
            return documents;
            
        } catch (error: any) {
            console.error(`❌ Error fetching documents needing analysis:`, error.message);
            return [];
        }
    }

    /**
     * Extract plain text from HTML content
     */
    private extractTextFromContent(content: string): string {
        // Remove HTML tags and decode entities
        return content
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
            .replace(/&amp;/g, '&') // Decode HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
    }

    /**
     * Get MIME type from document metadata
     */
    private getMimeTypeFromDocument(document: IDocument): string {
        if (document.googleDocId) {
            return 'application/vnd.google-apps.document';
        }
        if (document.linkUrl) {
            return 'text/html';
        }
        return 'text/plain';
    }

    /**
     * Determine if document should undergo deep analysis based on pre-classification
     */
    private isRelevantForDeepAnalysis(category: string, document: IDocument): boolean {
        // High-priority categories for deep analysis
        const highPriorityCategories = [
            'customer_feedback',
            'product_requirements',
            'support_issue',
            'meeting_summary',
            'escalation',
            'feature_request'
        ];
        
        if (highPriorityCategories.includes(category)) {
            return true;
        }
        
        // Always analyze meeting summaries and documents with customers
        if (document.documentType === 'meeting_summary' || document.customerId) {
            return true;
        }
        
        // Analyze documents with action items or key points
        if (document.actionItems && document.actionItems.length > 0) {
            return true;
        }
        
        if (document.keyPoints && document.keyPoints.length > 0) {
            return true;
        }
        
        return false;
    }
}

export default new DocumentAnalysisService();
