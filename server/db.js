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
  if (db) {
    return db;
  }

  await client.connect();

  db = client.db("jobhunt");

  console.log("MongoDB Atlas connected successfully");
  console.log("Database: jobhunt");

  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database is not connected");
  }

  return db;
}