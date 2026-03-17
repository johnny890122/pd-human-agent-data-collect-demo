import mongoose from 'mongoose';

let connectPromise = null;

export const isDbConfigured = () => Boolean(process.env.MONGODB_URI);

export async function connectToDatabase() {
  if (!isDbConfigured()) {
    return null;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectPromise) {
    connectPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  await connectPromise;
  return mongoose.connection;
}
