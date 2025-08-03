import { ObjectId } from './index';

export interface IUser {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarImage: string;
  llmModel: string | ObjectId;
  email: {
    type: string;
  };
  password: {
    type: string;
  };
  registered: {
    type: boolean;
  };
  organization: string | ObjectId;
  department: {
    type: string;
  };
  group?: {
    type: string;
  };
  roles: string[];
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
