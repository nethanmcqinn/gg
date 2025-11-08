import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../config/db.js';
import { User } from '../models/User.js';

async function run() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('ADMIN_EMAIL or ADMIN_PASSWORD not set');
    process.exit(1);
  }

  await connectToDatabase();
  const passwordHash = await bcrypt.hash(password, 10);
  const res = await User.updateOne(
    { email },
    { $set: { email, passwordHash, role: 'admin', isVerified: true, verificationToken: undefined } },
    { upsert: true }
  );
  console.log('Admin seed complete:', res.acknowledged ? 'ok' : 'failed');
  await mongoose.disconnect();
}

run();


