import { observable, runInAction, action, makeObservable, toJS } from 'mobx';
import invoiceService from '@/services/invoice-service';
import { IInvoice } from '@common/types';

// import { roles } from '../utils/permissions';
class InvoiceStore {
  invoiceAutofill: IInvoice | undefined;
  tags: string[] = [];
  constructor() {
    this.invoiceAutofill = undefined;
    makeObservable(this, {
      invoiceAutofill: observable,
      autofillInvoice: observable,
      tags: observable,
    });
  }

  autofillInvoice = async (file: File) => {
    const invoice: IInvoice = await invoiceService.autofill(file);
    runInAction(() => {
        this.invoiceAutofill = invoice;
      })
    return invoice;
  }

  getTags = async () => {
    const tags = await invoiceService.getTags();
    runInAction(() => {
      this.tags = tags;
    })
    return tags;
  }
}

const store = new InvoiceStore();

export default store;
