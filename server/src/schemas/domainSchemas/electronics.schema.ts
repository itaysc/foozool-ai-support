import { Schema } from 'mongoose';

export const ElectronicsDetailsSchema = new Schema({
  productType: { type: String },
  brand: { type: String },
  model: { type: String },
  serialNumber: { type: String },
  purchaseDate: { type: Date },
  issueType: { type: String },
  issueDescription: { type: String },
  purchaseChannel: { type: String },
  warrantyStatus: { type: String },
  accessoriesIncluded: [{ type: String }],
  refundRequested: { type: Boolean, default: false },
  replacementRequested: { type: Boolean, default: false },
  resolutionStatus: { type: String },
}, { _id: false });
