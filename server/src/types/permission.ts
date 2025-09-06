import mongoose from 'mongoose';

export interface IPermission {
  _id: mongoose.Types.ObjectId;
  key: string; // machine key like "insights.read"
  name: string; // human readable label
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}


