import mongoose from 'mongoose';

export interface IRole {
  _id: mongoose.Types.ObjectId;
  name: string; // unique role name like "admin"
  description?: string;
  permissions: string[]; // array of permission keys
  createdAt: Date;
  updatedAt: Date;
}


