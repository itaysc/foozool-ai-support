import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  llmModel: mongoose.Types.ObjectId;
  email: {
    type: string;
  };
  password: {
    type: string;
  };
  registered: {
    type: boolean;
  };
  organization: {
    type: typeof mongoose.Schema.Types.ObjectId;
  };
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
