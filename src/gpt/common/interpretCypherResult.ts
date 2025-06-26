import { askToGemini } from "./askToGemini";

export async function interpretCypherResult({
    question,
    prompt,
    cypherQuery,
    rawResult
  }: {
    question: string;
    prompt: string;
    cypherQuery: string;
    rawResult: any;
  }): Promise<string> {
    const fullPrompt = `
  Eres un asistente experto en derecho y resoluciones judiciales. A continuación se te muestra una pregunta del usuario, la consulta Cypher generada para un grafo de resoluciones, y el resultado obtenido desde la base de datos.
  
  Tu tarea es interpretar el resultado en lenguaje natural para que el usuario no técnico lo entienda fácilmente. Usa lenguaje claro y conciso.
  
  ---
  Prompt utilizado para generar Cypher:
  ${prompt}
  
  Consulta Cypher generada:
  ${cypherQuery}
  
  Resultado de la base de datos (JSON):
  ${JSON.stringify(rawResult, null, 2)}
  
  ---
  Respuesta explicada:
  `;
  
    const response = await askToGemini({ prompt: fullPrompt });
  
    return response.trim();
  }
  