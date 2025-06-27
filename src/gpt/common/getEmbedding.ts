import { GoogleGenAI } from "@google/genai";

import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: [text],
    config: { outputDimensionality: 768 }
  });

  return response.embeddings?.[0]?.values ?? [];
}
