import { makeAutoObservable, runInAction } from 'mobx';
import featuresService, { FeatureDto, FeatureUsageDto } from '@/services/features-service';

class FeaturesStore {
  features: FeatureDto[] = [];
  usageByCustomer: Record<string, FeatureUsageDto[]> = {};
  isLoading = false;
  loaded = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async ensureLoaded() {
    if (this.loaded || this.isLoading) return;
    this.isLoading = true;
    try {
      const feats = await featuresService.getFeatures();
      runInAction(() => {
        this.features = feats;
        this.loaded = true;
        this.isLoading = false;
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e?.message || 'Failed to load features';
        this.isLoading = false;
      });
    }
  }

  async loadUsageForCustomer(customerId: string) {
    try {
      const usage = await featuresService.getFeatureUsage({ customerId });
      runInAction(() => {
        this.usageByCustomer[customerId] = usage;
      });
    } catch (e) {
      // ignore
    }
  }

  async addUsage(payload: { featureId?: string; featureName?: string; customerId?: string; activeUsersCount?: number; utilizationPercent?: number; usageDate?: string }) {
    const created = await featuresService.createFeatureUsage(payload);
    if (created.customerId) {
      await this.loadUsageForCustomer(created.customerId);
    }
    return created;
  }
}

const featuresStore = new FeaturesStore();
export default featuresStore;


