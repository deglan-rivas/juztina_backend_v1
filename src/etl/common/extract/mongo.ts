import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DBNAME || "etl_db_2";
const dbCollection = process.env.MONGO_DBCOLLECTION || "resoluciones_2";
let client: MongoClient | null = null;

export async function saveToMongo(data: any[]) {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("resoluciones_2");
  await collection.insertMany(data);
  await client.close();
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

export async function fetchResoluciones(limit: number = 10): Promise<any[]> {
  const client = await getMongoClient();
  const db = client.db(dbName);
  const collection = db.collection(dbCollection);
  const results = await collection.find().limit(limit).skip(0).toArray();
  return results;
}