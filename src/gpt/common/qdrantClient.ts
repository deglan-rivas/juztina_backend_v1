import { QdrantClient } from '@qdrant/js-client-rest';
import * as dotenv from "dotenv";
dotenv.config();

export const qdrant = new QdrantClient({ url: process.env.QDRANT_HOST! });

export const COLLECTION_NAME = process.env.QDRANT_COLLECTION!;;
