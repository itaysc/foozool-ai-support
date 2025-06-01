import { observable, runInAction, action, makeObservable, toJS } from 'mobx';
import configService from '@/services/config-service';
import { IOrganizationConfig } from '@common/types';
import { getDataFromLocalStorage, setDataToLocalStorage } from '@/services/local-storage';

// import { roles } from '../utils/permissions';
class ConfigStore {
  config: IOrganizationConfig | undefined;
  selectedModel: string | undefined;
  constructor() {
    this.config = undefined;
    makeObservable(this, {
      config: observable,
      fetchConfig: observable,
    });
  }

  fetchConfig = async (vendorId?: string) => {
    if(this.config) return toJS(this.config);
    runInAction(async () => {
      const config: IOrganizationConfig = await configService.get(vendorId);
      this.config = toJS(config);
      const selectedModel = getDataFromLocalStorage('selectedModel');
      if (selectedModel) {
        this.selectedModel = selectedModel;
      } else {
        const recommendedModel = this.config?.supportedModels.find((model) => model.isRecommended);
        this.selectedModel = recommendedModel?.model || this.config?.supportedModels[0].model;
      }
      return this.config;
    })
  }

  getConfig = () => {
    return toJS(this.config);
  }

  setSelectedModel = (model: string) => {
    setDataToLocalStorage('selectedModel', model);
    this.selectedModel = model;
  }

}

const store = new ConfigStore();

export default store;
