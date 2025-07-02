import { askToGemini } from "./askToGemini";

export async function interpretQdrantResult({
    question,
    concatenatedChunks
  }: {
    question: string;
    concatenatedChunks: string;
  }): Promise<string> {
    const explanation = await askToGemini({
      prompt: `
  Eres un asistente jurídico. A continuación se muestra una pregunta del usuario y 100 fragmentos relevantes extraídos de resoluciones judiciales.
  
  Pregunta:
  ${question}
  
  Fragmentos encontrados:
  ${concatenatedChunks}
  
  Explica una posible respuesta basada en los fragmentos.
      `
    });
  
    return explanation.trim();
  }
  