import mongoose, { Schema } from "mongoose";

const seedTrackSchema = new Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, required: true },
});

export const SeedTrackModel = mongoose.model('SeedTrack', seedTrackSchema);
