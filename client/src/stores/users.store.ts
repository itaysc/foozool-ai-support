import { makeAutoObservable, runInAction } from 'mobx';
import usersService from '@/services/users-service';
import { IUser } from '@/types/user';

class UsersStore {
  users: IUser[] = [];
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async loadUsers() {
    try {
      this.isLoading = true;
      this.error = null;
      const data = await usersService.getUsersList();
      runInAction(() => { 
        this.users = data; 
      });
    } catch (e: any) {
      runInAction(() => { 
        this.error = e.response?.data?.error || 'Failed to load users'; 
      });
    } finally {
      runInAction(() => { 
        this.isLoading = false; 
      });
    }
  }

  getUserById(userId: string): IUser | undefined {
    return this.users.find(user => user._id === userId);
  }
}

const usersStore = new UsersStore();
export default usersStore;

