import { MongoClient, type Db } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/svce-cafeteria"

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase(): Promise<Db> {
  try {
    // If we already have a connection, use it
    if (cachedClient && cachedDb) {
      console.log("Using cached MongoDB connection")
      return cachedDb
    }

    console.log("Creating new MongoDB connection to:", MONGODB_URI)
    // Create a new connection
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Successfully connected to MongoDB")

    const db = client.db()
    console.log("Connected to database:", db.databaseName)

    // Cache the connection
    cachedClient = client
    cachedDb = db

    return db
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

