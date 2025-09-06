import mongoose, { Document } from 'mongoose';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarImage: string;
  llmModel: string | mongoose.Types.ObjectId;
  email: {
    type: string;
  };
  password: {
    type: string;
  };
  registered: {
    type: boolean;
  };
  organization: string | mongoose.Types.ObjectId;
  department: {
    type: string;
  };
  group?: {
    type: string;
  };
  roles: (string | mongoose.Types.ObjectId)[];
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
