import mongoose, { Schema } from 'mongoose';
import { IPermission } from '../types/permission';

const permissionSchema = new Schema({
  key: { type: String, required: true, unique: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
}, { timestamps: true });

export const PermissionModel = mongoose.model<IPermission>('Permission', permissionSchema);


