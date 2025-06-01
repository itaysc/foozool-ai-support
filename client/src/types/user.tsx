import { IOrganization } from '@common/types';

export default interface User {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  scopes: string[];
  roles: string[];
  organization: IOrganization;
  avatarImage?: string;
}