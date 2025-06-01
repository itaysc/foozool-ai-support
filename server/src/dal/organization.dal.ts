import { IOrganization } from '@common/types';
import { OrganizationModel } from '../schemas/organization.schema';

export const getDemoOrganization = async (): Promise<IOrganization | null> => {
  return OrganizationModel.findOne({ name: 'demo' });
};

export const create = async (organization: IOrganization): Promise<IOrganization> => {
  return await OrganizationModel.create(organization);
};

export const findBySignature = async (signature: string): Promise<IOrganization | null> => {
  return await OrganizationModel.findOne({ signature });
};
