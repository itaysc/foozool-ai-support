import { makeAutoObservable, runInAction } from 'mobx';
import botsService from '@/services/bots-service';
import { BotDto, CreateBotRequestDto } from '@/types/bot';

class BotsStore {
  items: BotDto[] = [];
  isLoading = false;
  isSaving = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async load() {
    try {
      this.isLoading = true;
      this.error = null;
      const data = await botsService.list();
      runInAction(() => { this.items = data; });
    } catch (e: any) {
      runInAction(() => { this.error = e.response?.data?.error || 'Failed to load bots'; });
    } finally {
      runInAction(() => { this.isLoading = false; });
    }
  }

  async create(payload: CreateBotRequestDto) {
    try {
      this.isSaving = true;
      this.error = null;
      const created = await botsService.create(payload);
      runInAction(() => { this.items.unshift(created); });
    } catch (e: any) {
      runInAction(() => { this.error = e.response?.data?.error || 'Failed to create bot'; });
      throw e;
    } finally {
      runInAction(() => { this.isSaving = false; });
    }
  }
}

const botsStore = new BotsStore();
export default botsStore;


