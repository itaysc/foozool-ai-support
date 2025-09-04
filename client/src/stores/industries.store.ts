import { makeAutoObservable, runInAction } from 'mobx';
import { fetchIndustries } from '@/services/industries-service';
import { INDUSTRIES as FALLBACK_INDUSTRIES } from '@/constants/industries';

class IndustriesStore {
  industries: string[] = [];
  isLoaded = false;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async ensureLoaded() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;
    try {
      const names = await fetchIndustries();
      runInAction(() => {
        this.industries = names && names.length ? names : FALLBACK_INDUSTRIES as unknown as string[];
        this.isLoaded = true;
        this.isLoading = false;
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e?.message || 'Failed to load industries';
        this.industries = FALLBACK_INDUSTRIES as unknown as string[];
        this.isLoaded = true;
        this.isLoading = false;
      });
    }
  }
}

const industriesStore = new IndustriesStore();
export default industriesStore;


