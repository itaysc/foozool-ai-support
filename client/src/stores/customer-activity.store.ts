import { makeAutoObservable, runInAction } from 'mobx';
import solutionsService, { SolutionDto } from '@/services/customerActivity-service';
// Legacy type retained for union compatibility
export interface FeatureUsageDto { _id: string }
import customerActivityService, { CustomerActivityDto } from '@/services/customer-activity.service';

class CustomerActivityStore {
  solutions: SolutionDto[] = [];
  usageByCustomer: Record<string, (FeatureUsageDto | CustomerActivityDto)[]> = {};
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
      const sols = await solutionsService.getSolutions();
      runInAction(() => {
        this.solutions = sols;
        this.loaded = true;
        this.isLoading = false;
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e?.message || 'Failed to load solutions';
        this.isLoading = false;
      });
    }
  }

  async loadUsageForCustomer(customerId: string) {
    try {
      const usage = await customerActivityService.listByCustomer(customerId);
      runInAction(() => {
        this.usageByCustomer[customerId] = usage;
      });
    } catch (e) {
      // ignore
    }
  }

  async addUsage(payload: { customerId: string; solutionName: string; metricType: 'count' | 'amount' | 'percentage' | 'duration' | 'custom'; metricValue: number; unit?: string; periodStart?: string; periodEnd?: string; activityDate?: string }) {
    const created = await customerActivityService.createActivity(payload as any);
    if (created.customerId) {
      await this.loadUsageForCustomer(created.customerId);
    }
    return created as any;
  }

  async deleteActivity(activityId: string, customerId: string) {
    try {
      await customerActivityService.deleteActivity(activityId);
      runInAction(() => {
        if (this.usageByCustomer[customerId]) {
          this.usageByCustomer[customerId] = this.usageByCustomer[customerId].filter(
            (activity: any) => activity._id !== activityId
          );
        }
      });
    } catch (e: any) {
      console.error('Failed to delete activity:', e);
      throw e;
    }
  }

  async upsertSolution(name: string) {
    try {
      const solution = await solutionsService.upsertSolution(name);
      runInAction(() => {
        // Add to solutions list if not already present
        const existingIndex = this.solutions.findIndex(s => s.name === name);
        if (existingIndex === -1) {
          this.solutions.push(solution);
          this.solutions.sort((a, b) => a.name.localeCompare(b.name));
        }
      });
      return solution;
    } catch (e: any) {
      console.error('Failed to upsert solution:', e);
      throw e;
    }
  }
}

const customerActivityStore = new CustomerActivityStore();
export default customerActivityStore;


