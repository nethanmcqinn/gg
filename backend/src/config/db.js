import mongoose from 'mongoose';

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
  });

  const connection = mongoose.connection;
  connection.on('connected', () => console.log('MongoDB connected'));
  connection.on('error', (err) => console.error('MongoDB error', err));
}


