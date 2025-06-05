import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  fullName?: string;
  avatarImage?: string;
  llmModel?: mongoose.Types.ObjectId;
  email: string;
  password?: string;
  registered: boolean;
  organization: mongoose.Types.ObjectId;
  department?: string;
  group?: string;
  roles: string[];
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
