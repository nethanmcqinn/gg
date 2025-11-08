import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../config/db.js';
import { Mouse } from '../models/Mouse.js';

const sample = [
  {
    name: 'Logitech G Pro X Superlight 2',
    brand: 'Logitech',
    slug: 'logitech-g-pro-x-superlight-2',
    price: 159.99,
    sensor: 'Hero 2',
    dpiMax: 32000,
    weightGrams: 60,
    connection: 'wireless',
    rgb: false,
    images: [
      'https://images.unsplash.com/photo-1618388189341-d5616a0f0897?q=80&w=1280&auto=format',
    ],
    rating: 4.8,
  },
  {
    name: 'Razer DeathAdder V3',
    brand: 'Razer',
    slug: 'razer-deathadder-v3',
    price: 149.99,
    sensor: 'Focus Pro 30K',
    dpiMax: 30000,
    weightGrams: 59,
    connection: 'wireless',
    rgb: true,
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=1280&auto=format',
    ],
    rating: 4.7,
  },
  {
    name: 'Glorious Model O',
    brand: 'Glorious',
    slug: 'glorious-model-o',
    price: 79.99,
    sensor: 'BAMF',
    dpiMax: 19000,
    weightGrams: 67,
    connection: 'wired',
    rgb: true,
    images: [
      'https://images.unsplash.com/photo-1585079542156-2755d9c5a0bb?q=80&w=1280&auto=format',
    ],
    rating: 4.5,
  },
  {
    name: 'SteelSeries Aerox 5',
    brand: 'SteelSeries',
    slug: 'steelseries-aerox-5',
    price: 99.99,
    sensor: 'TrueMove Air',
    dpiMax: 18000,
    weightGrams: 66,
    connection: 'wireless',
    rgb: true,
    images: [
      'https://images.unsplash.com/photo-1611224885990-628db67a6677?q=80&w=1280&auto=format',
    ],
    rating: 4.4,
  },
  {
    name: 'Zowie EC2-C',
    brand: 'Zowie',
    slug: 'zowie-ec2-c',
    price: 69.99,
    sensor: '3360',
    dpiMax: 3200,
    weightGrams: 73,
    connection: 'wired',
    rgb: false,
    images: [
      'https://images.unsplash.com/photo-1600861194942-02b5d2f18b83?q=80&w=1280&auto=format',
    ],
    rating: 4.6,
  },
];

async function run() {
  try {
    await connectToDatabase();
    for (const item of sample) {
      await Mouse.updateOne({ slug: item.slug }, { $set: item }, { upsert: true });
    }
    console.log(`Seeded ${sample.length} mice`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();


