import mongoose from 'mongoose';

const MouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    price: { type: Number, default: 0 },
    sensor: { type: String, default: '' },
    dpiMax: { type: Number, default: 0 },
    weightGrams: { type: Number, default: 0 },
    connection: { type: String, enum: ['wired', 'wireless'], default: 'wired' },
    rgb: { type: Boolean, default: false },
    images: { type: [String], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 0 },
  },
  { timestamps: true }
);

export const Mouse = mongoose.model('Mouse', MouseSchema);
