import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DBNAME_PROCESS_DOCUMENTS || "resoluciones_2";
const dbCollection = process.env.MONGO_DBCOLLECTION_PROCESS_DOCUMENTS || "documentos_embed_2";
let client: MongoClient | null = null;

export async function storeDocumentInMongo(document: any) {
    const mongo = new MongoClient(process.env.MONGO_URI!);
    await mongo.connect();
    const db = mongo.db(dbName);
    await db.collection(dbCollection).insertOne(document);
    await mongo.close();
}