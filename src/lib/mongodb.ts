import mongoose from "mongoose";


interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/analyticsliv_blog";

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const safeUri = MONGODB_URI.replace(/:([^@]+)@/, ":****@");
    console.log("Connecting to MongoDB:", safeUri);

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("Connected to MongoDB database:", mongooseInstance.connection.name);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
