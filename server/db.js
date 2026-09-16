import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing from .env");
}

const client = new MongoClient(uri);

let db;

export async function connectDatabase() {
  try {
    // Return existing connection
    if (db) {
      return db;
    }

    // Connect to MongoDB Atlas
    await client.connect();

    // Select JobHunt database
    db = client.db("jobhunt");

    // Check whether the candidates collection exists
    const collections = await db
      .listCollections({ name: "candidates" })
      .toArray();

    // Create collection if it doesn't exist
    if (collections.length === 0) {
      await db.createCollection("candidates");

      console.log("Created collection: candidates");
    }

    // Create useful indexes
    const candidatesCollection = db.collection("candidates");

    await candidatesCollection.createIndex({ email: 1 }, { unique: true });
    await candidatesCollection.createIndex({ status: 1 });
    await candidatesCollection.createIndex({ plan: 1 });
    await candidatesCollection.createIndex({ owner: 1 });

    console.log("MongoDB Atlas connected successfully");
    console.log("Database: jobhunt");
    console.log("Collection: candidates");

    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database is not connected");
  }

  return db;
}

export async function closeDatabase() {
  await client.close();
  db = null;

  console.log("MongoDB connection closed");
}