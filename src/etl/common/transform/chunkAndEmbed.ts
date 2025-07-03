import { GoogleGenAI } from "@google/genai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from 'crypto';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const MODEL = "text-embedding-004";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const qdrant = new QdrantClient({ url: process.env.QDRANT_HOST! });
const COLLECTION = process.env.QDRANT_COLLECTION!;

export async function chunkAndEmbed(text: string, law_id: string, type: string, chunkSize = 500, overlap = 50) {
    // TODO agregar un campo type: "Resolución Administrativa"
    /**
     * Contenido guardado en qdrant
      {
        id: "uuid",
        payload: {
          text: "contenido del chunk",
          law_id: "000040-2025-P-CE-PJ",
          type: "Resolución Administrativa"
        },
        vector: [0.12, 0.44, ..., 0.08] // un array de 768 números
      }
     */
      const MAX_BATCH = 100;
      const chunks: string[] = [];
  
      for (let i = 0; i < text.length; i += chunkSize - overlap) {
        const chunk = text.slice(i, i + chunkSize).trim();
        if (chunk.length > 0) chunks.push(chunk);
      }
    
      const allEmbeddings: number[][] = [];
    
      // Procesar en lotes de hasta 100
      for (let i = 0; i < chunks.length; i += MAX_BATCH) {
        const batch = chunks.slice(i, i + MAX_BATCH);
        const response = await ai.models.embedContent({
          model: MODEL,
          contents: batch,
          config: { outputDimensionality: 768 }
        });
    
        if (!response.embeddings) throw new Error("No embeddings returned");
        const vectors = response.embeddings.map((e) => e.values!);
        allEmbeddings.push(...vectors);
      }
    
      // Crear colección si no existe
      await qdrant.createCollection(COLLECTION, {
        vectors: { size: 768, distance: "Cosine" }
      }).catch(() => {}); // ignora si ya existe
    
      const payloads = chunks.map((chunk, i) => ({
        id: randomUUID(),
        payload: {
          text: chunk,
          law_id,
          type
        },
        vector: allEmbeddings[i]
      }));
    
      await qdrant.upsert(COLLECTION, { points: payloads });
  
      return payloads;
  }