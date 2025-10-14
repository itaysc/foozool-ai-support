import { makeAutoObservable, runInAction } from 'mobx';
import documentsService, { IDocument, CreateDocumentRequest } from '@/services/documents-service';

class DocumentsStore {
  documents: IDocument[] = [];
  isLoading = false;
  isSaving = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async loadDocuments() {
    try {
      this.isLoading = true;
      this.error = null;
      const data = await documentsService.getDocuments();
      runInAction(() => {
        this.documents = data;
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e.response?.data?.error || 'Failed to load documents';
      });
      throw e;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async createDocument(data: CreateDocumentRequest): Promise<IDocument> {
    try {
      this.isSaving = true;
      this.error = null;
      const document = await documentsService.createDocument(data);
      runInAction(() => {
        this.documents = [document, ...this.documents];
      });
      return document;
    } catch (e: any) {
      runInAction(() => {
        this.error = e.response?.data?.error || 'Failed to create document';
      });
      throw e;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  }

  async updateDocument(id: string, data: Partial<CreateDocumentRequest>): Promise<IDocument> {
    try {
      this.isSaving = true;
      this.error = null;
      const updatedDocument = await documentsService.updateDocument(id, data);
      runInAction(() => {
        const index = this.documents.findIndex(doc => doc._id === id);
        if (index !== -1) {
          this.documents[index] = updatedDocument;
        }
      });
      return updatedDocument;
    } catch (e: any) {
      runInAction(() => {
        this.error = e.response?.data?.error || 'Failed to update document';
      });
      throw e;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;
      await documentsService.deleteDocument(id);
      runInAction(() => {
        this.documents = this.documents.filter(doc => doc._id !== id);
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e.response?.data?.error || 'Failed to delete document';
      });
      throw e;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  getDocumentById(documentId: string): IDocument | undefined {
    return this.documents.find(doc => doc._id === documentId);
  }
}

const documentsStore = new DocumentsStore();
export default documentsStore;

