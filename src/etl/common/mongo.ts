import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DBNAME || "etl_db_2";

export async function saveToMongo(data: any[]) {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("resoluciones_2");
  await collection.insertMany(data);
  await client.close();
}