import { askToGemini } from "./askToGemini";

export async function interpretQdrantResult({
    question,
    concantenatedChunks
  }: {
    question: string;
    concantenatedChunks: string;
  }): Promise<string> {
    const explanation = await askToGemini({
      prompt: `
  Eres un asistente jurídico. A continuación se muestra una pregunta del usuario y 100 fragmentos relevantes extraídos de resoluciones judiciales.
  
  Pregunta:
  ${question}
  
  Fragmentos encontrados:
  ${concantenatedChunks}
  
  Explica una posible respuesta basada en los fragmentos.
      `
    });
  
    return explanation.trim();
  }
  