import { IOrganization } from '@common/types';
import { findBySignature, create } from '../../dal/organization.dal';

export const findOrganizationBySignature = async (signature: string): Promise<IOrganization | null> => {
  return await findBySignature(signature);
};

export const createOrganization = async (organization: IOrganization): Promise<IOrganization> => {
  return await create(organization);
};