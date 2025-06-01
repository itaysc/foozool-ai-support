import { observable, runInAction, action, makeObservable, toJS } from 'mobx';
import { ICustomer } from '@common/types';
import customerService from '@/services/customer-service';

class CustomerStore {
  customers: ICustomer[] = [];

  constructor() {
    makeObservable(this, {
      customers: observable,
      fetchCustomers: observable,
    });
  }

  fetchCustomers = async () => {
    if(this.customers && this.customers.length > 0) return toJS(this.customers);
    runInAction(async () => {
      const customers: ICustomer[] = await customerService.getCustomers();
      this.customers = toJS(customers);
      return this.customers;
    })
  }
}

const store = new CustomerStore();

export default store;
