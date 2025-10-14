import axios from './axios';
import config from '@/config';

const getRoute = (endpoint: string) => {
  return `${config.apiUrl}/${endpoint}`;
};

const googleService = {
  // Check if organization has a Google token
  async checkTokenStatus(): Promise<{ hasToken: boolean; message: string }> {
    const response = await axios.get(getRoute('google/token-status'));
    return {
      hasToken: response.data.hasToken,
      message: response.data.message,
    };
  },

  // Get Google OAuth connection URL
  async getConnectionUrl(): Promise<{ redirectUrl: string }> {
    const response = await axios.get(getRoute('google/connect'));
    return {
      redirectUrl: response.data.redirectUrl,
    };
  },

  // Create a new Google Doc
  async createDoc(title?: string, customerName?: string): Promise<{
    documentId: string;
    documentUrl: string;
    title: string;
  }> {
    const response = await axios.post(getRoute('google/docs/create'), {
      title,
      customerName,
    });
    return {
      documentId: response.data.documentId,
      documentUrl: response.data.documentUrl,
      title: response.data.title,
    };
  },
};

export default googleService;

