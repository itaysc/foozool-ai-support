import mongoose, { Schema } from 'mongoose';
import { IRole } from '../types/role';

const roleSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true, lowercase: true },
  description: { type: String },
  // Store permission keys to avoid joins; resolve to Permission docs only when needed
  permissions: { type: [String], default: [] },
}, { timestamps: true });

export const RoleModel = mongoose.model<IRole>('Role', roleSchema);


