// src/schemas/TransportationSchema.ts
import { Schema } from 'mongoose';
import { ITransportationDetails } from '@common/types/domains';

export const TransportationDetailsSchema: Schema = new Schema<ITransportationDetails>({
  domain: { type: String, default: 'transportation' },
  luggagePolicy: { type: String },
  cancellationPolicy: { type: String },
  departureTime: { type: Date },
  arrivalTime: { type: Date },
  paxAmount: { type: Number },
  supplierName: { type: String },
  operatorName: { type: String },
  numOfLegs: { type: Number },
  pickupAddress: { type: String },
  dropoffAddress: { type: String },
  pickupLatitude: { type: Number },
  pickupLongitude: { type: Number },
  dropoffLatitude: { type: Number },
  dropoffLongitude: { type: Number },
  pickupTime: { type: Date },
  dropoffTime: { type: Date },
  pickupTimezone: { type: String },
  dropoffTimezone: { type: String },
  pickupNotes: { type: String },
  dropoffNotes: { type: String },
  pickupContactName: { type: String },
  dropoffContactName: { type: String },
  pickupContactPhone: { type: String },
  dropoffContactPhone: { type: String },
  isPrivateTransfer: { type: Boolean, default: false },
});
