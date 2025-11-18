import mongoose from 'mongoose';

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Brand = mongoose.model('Brand', BrandSchema);
