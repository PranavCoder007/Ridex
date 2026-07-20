const mongoose = require('mongoose');

// Cache connection across serverless invocations (Vercel cold starts)
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected, reuse
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI || 'mongodb+srv://rideex_admin:ridex1302@cluster0.zyqewwe.mongodb.net/?appName=Cluster0';

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => {
      console.log(`✅ MongoDB Connected: ${m.connection.host}/${m.connection.name}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
