import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface Options {
    prompt: string;
    model?: string;
}

export async function askToGemini({prompt, model = 'gemini-2.5-flash-lite-preview-06-17'}: Options): Promise<string> {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });

  const text = response.text! || "";
  return text.trim();
}
