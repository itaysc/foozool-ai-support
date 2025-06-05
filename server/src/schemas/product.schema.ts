import { Schema, model, Document } from 'mongoose';

// TypeScript interfaces for nested fields
interface Duration {
  unit: 'days' | 'months' | 'years';
  value: number;
}

export interface Product extends Document {
  productName: string;
  serialNumber: string;
  purchaseDate: string; // ISO 8601
  price: number;
  currency: 'USD' | 'EUR' | 'GBP' | string;
  refundPolicy: Duration;
  warrantyPeriod: Duration;
  storeLocation: string;
  customerName: string;
  customerEmail: string;
  metadata: Record<string, string>;
}

const DurationSchema = new Schema<Duration>(
  {
    unit: {
      type: String,
      enum: ['days', 'months', 'years'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
  },
  { _id: false } // Prevent Mongoose from creating _id for subdocument
);

const ProductSchema = new Schema<Product>(
  {
    productName: { type: String, required: true },
    serialNumber: { type: String, required: true },
    purchaseDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/ },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    refundPolicy: { type: DurationSchema, required: true },
    warrantyPeriod: { type: DurationSchema, required: true },
    storeLocation: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, match: /.+@.+\..+/ },
    metadata: {
      type: Map,
      of: String,
      required: false
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

export const ProductModel = model<Product>('Product', ProductSchema);
