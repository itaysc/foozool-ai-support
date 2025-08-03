import axios from '@/services/axios';
import config from '@/config';

const getRoute = (endpoint: string) => {
  return `${config.apiUrl}/${endpoint}`;
};

const apiService = {
  // Insights API
  insights: {
    async getAll(params?: { category?: string; severity?: string; status?: string; limit?: number; offset?: number }) {
      const response = await axios.get(getRoute('insights'), { params });
      return response.data;
    },

    async getById(id: string) {
      const response = await axios.get(getRoute(`insights/${id}`));
      return response.data;
    },

    async create(data: any) {
      const response = await axios.post(getRoute('insights'), data);
      return response.data;
    },

    async update(id: string, data: any) {
      const response = await axios.patch(getRoute(`insights/${id}`), data);
      return response.data;
    },

    async delete(id: string) {
      const response = await axios.delete(getRoute(`insights/${id}`));
      return response.data;
    },

    async updateStatus(id: string, status: string) {
      const response = await axios.patch(getRoute(`insights/${id}/status`), { status });
      return response.data;
    },

    async getSummary(params?: { days?: number }) {
      const response = await axios.get(getRoute('insights/summary'), { params });
      return response.data;
    },

    async getTrends(params?: { days?: number }) {
      const response = await axios.get(getRoute('insights/trends'), { params });
      return response.data;
    }
  },

  // Action Thresholds API
  actionThresholds: {
    async getAll() {
      const response = await axios.get(getRoute('autonomous-ai/thresholds'));
      return response.data;
    },

    async getById(id: string) {
      const response = await axios.get(getRoute(`autonomous-ai/thresholds/${id}`));
      return response.data;
    },

    async create(data: any) {
      const response = await axios.post(getRoute('autonomous-ai/thresholds'), data);
      return response.data;
    },

    async update(id: string, data: any) {
      const response = await axios.put(getRoute(`autonomous-ai/thresholds/${id}`), data);
      return response.data;
    },

    async delete(id: string) {
      const response = await axios.delete(getRoute(`autonomous-ai/thresholds/${id}`));
      return response.data;
    },

    async toggleStatus(id: string) {
      const response = await axios.patch(getRoute(`autonomous-ai/thresholds/${id}/toggle`));
      return response.data;
    }
  },

  // Customer Tiers API
  customerTiers: {
    async getAll() {
      const response = await axios.get(getRoute('autonomous-ai/customer-tiers'));
      return response.data;
    },

    async getById(id: string) {
      const response = await axios.get(getRoute(`autonomous-ai/customer-tiers/${id}`));
      return response.data;
    },

    async create(data: any) {
      const response = await axios.post(getRoute('autonomous-ai/customer-tiers'), data);
      return response.data;
    },

    async update(id: string, data: any) {
      const response = await axios.put(getRoute(`autonomous-ai/customer-tiers/${id}`), data);
      return response.data;
    },

    async delete(id: string) {
      const response = await axios.delete(getRoute(`autonomous-ai/customer-tiers/${id}`));
      return response.data;
    }
  },

  // Dashboard Settings API
  dashboardSettings: {
    async get(organizationId: string) {
      const response = await axios.get(getRoute(`organizations/${organizationId}/dashboard-settings`));
      return response.data;
    },

    async update(organizationId: string, data: any) {
      const response = await axios.put(getRoute(`organizations/${organizationId}/dashboard-settings`), data);
      return response.data;
    },

    async reset(organizationId: string) {
      const response = await axios.delete(getRoute(`organizations/${organizationId}/dashboard-settings`));
      return response.data;
    },

    async getDefaults(organizationId: string) {
      const response = await axios.get(getRoute(`organizations/${organizationId}/dashboard-settings/defaults`));
      return response.data;
    }
  },

  // Action Logs API
  actionLogs: {
    async getAll(params?: { limit?: number; offset?: number }) {
      const response = await axios.get(getRoute('autonomous-ai/action-logs'), { params });
      return response.data;
    },

    async getByTicket(ticketId: string, params?: { limit?: number }) {
      const response = await axios.get(getRoute(`autonomous-ai/action-logs/ticket/${ticketId}`), { params });
      return response.data;
    },

    async getByType(actionType: string, params?: { limit?: number }) {
      const response = await axios.get(getRoute(`autonomous-ai/action-logs/type/${actionType}`), { params });
      return response.data;
    },

    async getByStatus(status: string, params?: { limit?: number }) {
      const response = await axios.get(getRoute(`autonomous-ai/action-logs/status/${status}`), { params });
      return response.data;
    },

    async getFailed(params?: { limit?: number }) {
      const response = await axios.get(getRoute('autonomous-ai/action-logs/failed'), { params });
      return response.data;
    },

    async getHighConfidence(params?: { confidenceThreshold?: number; limit?: number }) {
      const response = await axios.get(getRoute('autonomous-ai/action-logs/high-confidence'), { params });
      return response.data;
    },

    async getDailyStats(params?: { date?: string }) {
      const response = await axios.get(getRoute('autonomous-ai/action-logs/stats/daily'), { params });
      return response.data;
    },

    async getSuccessRate(params?: { startDate?: string; endDate?: string }) {
      const response = await axios.get(getRoute('autonomous-ai/action-logs/stats/success-rate'), { params });
      return response.data;
    },

    async getPerformanceMetrics(params?: { days?: number }) {
      const response = await axios.get(getRoute('autonomous-ai/action-logs/stats/performance'), { params });
      return response.data;
    }
  },

  // Chat/Search API
  chat: {
    async sendMessage(message: string, params?: { limit?: number; minQualityScore?: number }) {
      const response = await axios.post(getRoute('search'), {
        query: message,
        limit: params?.limit || 10,
        minQualityScore: params?.minQualityScore || 0.5
      });
      return response.data;
    }
  }
};

export default apiService; 