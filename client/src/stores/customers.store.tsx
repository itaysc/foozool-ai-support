import { makeAutoObservable, runInAction } from 'mobx';
import customersService from '@/services/customers-service';
import { 
  ICustomer, 
  CustomerFilters, 
  CustomerStats, 
  CreateCustomerRequest, 
  UpdateCustomerRequest,
  CustomerListResponse 
} from '@/types';

class CustomersStore {
  customers: ICustomer[] = [];
  stats: CustomerStats | null = null;
  currentCustomer: ICustomer | null = null;
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  lastUpdated: Date | null = null;
  
  // Pagination
  currentPage = 1;
  totalPages = 0;
  totalCustomers = 0;
  rowsPerPage = 10;
  
  // Filters
  filters: CustomerFilters = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  constructor() {
    makeAutoObservable(this);
  }

  // Actions
  setLoading = (loading: boolean) => {
    this.isLoading = loading;
  };

  setSaving = (saving: boolean) => {
    this.isSaving = saving;
  };

  setError = (error: string | null) => {
    this.error = error;
  };

  setCustomers = (customers: ICustomer[]) => {
    this.customers = customers;
  };

  setStats = (stats: CustomerStats) => {
    this.stats = stats;
  };

  setCurrentCustomer = (customer: ICustomer | null) => {
    this.currentCustomer = customer;
  };

  setLastUpdated = (date: Date) => {
    this.lastUpdated = date;
  };

  setPagination = (page: number, totalPages: number, totalCustomers: number) => {
    this.currentPage = page;
    this.totalPages = totalPages;
    this.totalCustomers = totalCustomers;
  };

  setRowsPerPage = (rowsPerPage: number) => {
    this.rowsPerPage = rowsPerPage;
    this.filters.limit = rowsPerPage;
  };

  setFilters = (filters: Partial<CustomerFilters>) => {
    this.filters = { ...this.filters, ...filters };
  };

  // Computed properties
  get hasData(): boolean {
    return this.customers.length > 0;
  }

  get hasStats(): boolean {
    return this.stats !== null;
  }

  get customersByHealthScore() {
    return this.customers.reduce((acc, customer) => {
      if (customer.healthScore) {
        const score = customer.healthScore;
        if (score >= 8) acc.excellent.push(customer);
        else if (score >= 6) acc.good.push(customer);
        else if (score >= 4) acc.fair.push(customer);
        else acc.poor.push(customer);
      }
      return acc;
    }, {
      excellent: [] as ICustomer[],
      good: [] as ICustomer[],
      fair: [] as ICustomer[],
      poor: [] as ICustomer[],
    });
  }

  get customersByIndustry() {
    return this.customers.reduce((acc, customer) => {
      const industry = customer.industry || 'Unknown';
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  get customersBySize() {
    return this.customers.reduce((acc, customer) => {
      const size = customer.companySize || 'Unknown';
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // API Actions
  fetchCustomers = async (filters?: Partial<CustomerFilters>) => {
    try {
      this.setLoading(true);
      this.setError(null);
      
      const updatedFilters = { ...this.filters, ...filters };
      const response: CustomerListResponse = await customersService.getAll(updatedFilters);
      
      runInAction(() => {
        this.setCustomers(response.customers);
        this.setPagination(response.page, response.totalPages, response.total);
        this.setFilters(updatedFilters);
        this.setLastUpdated(new Date());
      });
    } catch (err: any) {
      runInAction(() => {
        this.setError(err.response?.data?.error || 'Failed to fetch customers');
      });
      console.error('Error fetching customers:', err);
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  };

  fetchStats = async () => {
    try {
      const statsData = await customersService.getStats();
      runInAction(() => {
        this.setStats(statsData);
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  fetchCustomerById = async (id: string) => {
    try {
      this.setLoading(true);
      this.setError(null);
      
      const customer = await customersService.getById(id);
      runInAction(() => {
        this.setCurrentCustomer(customer);
      });
    } catch (err: any) {
      runInAction(() => {
        this.setError(err.response?.data?.error || 'Failed to fetch customer');
      });
      console.error('Error fetching customer:', err);
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  };

  createCustomer = async (data: CreateCustomerRequest) => {
    try {
      this.setSaving(true);
      this.setError(null);
      
      const newCustomer = await customersService.create(data);
      
      runInAction(() => {
        this.customers.unshift(newCustomer);
        this.totalCustomers += 1;
        this.setLastUpdated(new Date());
      });
      
      return newCustomer;
    } catch (err: any) {
      runInAction(() => {
        this.setError(err.response?.data?.error || 'Failed to create customer');
      });
      throw err;
    } finally {
      runInAction(() => {
        this.setSaving(false);
      });
    }
  };

  updateCustomer = async (id: string, data: UpdateCustomerRequest) => {
    try {
      this.setSaving(true);
      this.setError(null);
      
      const updatedCustomer = await customersService.update(id, data);
      
      runInAction(() => {
        const index = this.customers.findIndex(c => c._id === id);
        if (index !== -1) {
          this.customers[index] = updatedCustomer;
        }
        if (this.currentCustomer?._id === id) {
          this.setCurrentCustomer(updatedCustomer);
        }
        this.setLastUpdated(new Date());
      });
      
      return updatedCustomer;
    } catch (err: any) {
      runInAction(() => {
        this.setError(err.response?.data?.error || 'Failed to update customer');
      });
      throw err;
    } finally {
      runInAction(() => {
        this.setSaving(false);
      });
    }
  };

  deleteCustomer = async (id: string) => {
    try {
      this.setSaving(true);
      this.setError(null);
      
      await customersService.delete(id);
      
      runInAction(() => {
        this.customers = this.customers.filter(c => c._id !== id);
        this.totalCustomers -= 1;
        if (this.currentCustomer?._id === id) {
          this.setCurrentCustomer(null);
        }
        this.setLastUpdated(new Date());
      });
    } catch (err: any) {
      runInAction(() => {
        this.setError(err.response?.data?.error || 'Failed to delete customer');
      });
      throw err;
    } finally {
      runInAction(() => {
        this.setSaving(false);
      });
    }
  };

  // Utility actions
  clearError = () => {
    this.setError(null);
  };

  clearCurrentCustomer = () => {
    this.setCurrentCustomer(null);
  };

  refreshData = async () => {
    await Promise.all([
      this.fetchCustomers(),
      this.fetchStats(),
    ]);
  };

  // Filter actions
  updateFilters = (newFilters: Partial<CustomerFilters>) => {
    this.setFilters(newFilters);
    this.fetchCustomers(newFilters);
  };

  setPage = (page: number) => {
    this.updateFilters({ page });
  };

  setSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    this.updateFilters({ sortBy: sortBy as any, sortOrder });
  };

  setIndustryFilter = (industry: string) => {
    this.updateFilters({ industry: industry || undefined, page: 1 });
  };

  setCompanySizeFilter = (companySize: string) => {
    this.updateFilters({ companySize: companySize || undefined, page: 1 });
  };

  setHealthScoreFilter = (min?: number, max?: number) => {
    this.updateFilters({ 
      healthScoreMin: min, 
      healthScoreMax: max, 
      page: 1 
    });
  };

  clearFilters = () => {
    const defaultFilters: CustomerFilters = {
      page: 1,
      limit: this.rowsPerPage,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    this.setFilters(defaultFilters);
    this.fetchCustomers(defaultFilters);
  };
}

const customersStore = new CustomersStore();
export default customersStore;
