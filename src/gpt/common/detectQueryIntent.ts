import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import { askToGemini } from './askToGemini';
dotenv.config();

const MODEL = 'gemini-2.5-flash-lite-preview-06-17';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

type QueryType = "graph" | "semantic" | "hybrid" | "unknown";

interface RoutingResult {
  queryType: QueryType;
  reason: string;
}

// LLM para detectar intención
// TODO mejorar este prompt pues a veces se limita a categorizar la pregunta como "graph" y no como "hybrid"
export async function detectQueryIntent(question: string): Promise<string> {
    const prompt = `
        Eres un asistente que clasifica preguntas jurídicas en una de estas categorías:
        - "graph": si la pregunta requiere relaciones entre normas jurídicas, personas o instituciones.
        - "semantic": si la pregunta requiere entender el contenido textual de una norma.
        - "hybrid": si involucra personas, instituciones, provincias o citas; pero también preguntan por el contenido del texto o su significado  (ej. contenido + relaciones).
        - "unknown": si la pregunta no está relacionada con leyes o resoluciones.

        Pregunta: """${question}"""
        Devuelve únicamente uno de estos tipos: "graph", "semantic", "hybrid" o "unknown".
        Ejm:
        Pregunta: "¿Qué dice la norma X sobre el tema Y?" - Respuesta: "semantic"
    `;

    const response = await askToGemini({
        model: MODEL,
        prompt: prompt,
    });

    return response
}

export async function splitIntention(question: string): Promise<{ graphQuestion: string, semanticQuestion: string}> {
    const prompt = `
        Eres un experto clasificando la dividiendo la intención de las preguntas jurídicas en dos partes:
        - "graphQuestion": si involucra relaciones entre normas jurídicas, personas, instituciones, provincias o citas.
        - "semanticQuestion": si la pregunta está directamente al contenido semántico.

        Ejm:
        Pregunta de Ejemplo: "¿Qué resoluciones del 2025 que tienen competencia en Lima citan normas de tipo 'Memorando'? y qué mencionan sobre el “plan estratégico”?" - Respuesta: "{'graphQuestion': '¿Qué resoluciones del 2025 que tienen competencia en Lima citan normas de tipo 'Memorando'?', 'semanticQuestion': 'qué mencionan sobre el “plan estratégico”?'}"

        Pregunta Real: """${question}"""
        Dame un JSON con las dos partes de la pregunta, sin explicaciones ni formato Markdown.
    `;

    let response = await askToGemini({
        model: MODEL,
        prompt: prompt,
    });

    if (response.startsWith('```json') || response.startsWith('```')) {
        response = response.replace(/^```json\s*|```$/g, '').trim();
      }

    return JSON.parse(response)
}
