// src/askGemini.ts
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function askGeminiWithContext(contexto: string, pregunta: string): Promise<string> {
  const prompt = `
  Eres un asistente jurídico. Usa el siguiente contexto extraído de resoluciones judiciales para responder la pregunta al final. Sé preciso y claro, y responde en español. Si no sabes la respuesta o la pregunta no es de carácter judicial legal, entonces responde como lo haría gtp-4o.

  ### CONTEXTO:
  ${contexto}

  ### PREGUNTA:
  ${pregunta}
    `.trim();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-preview-06-17',
    contents: prompt,
  });

  return response.text!;
}
