import { qdrant } from './qdrantClient';
import { getEmbedding } from './getEmbedding';
import { askToGemini } from './askToGemini';

import * as dotenv from "dotenv";
dotenv.config();

// export async function queryQdrant(question: string): Promise<{ answer: string }> {
export async function queryQdrant(question: string): Promise<any> {
  const COLLECTION_NAME = process.env.QDRANT_COLLECTION!;;
  const embedding = await getEmbedding(question);

  const searchResult = await qdrant.search(COLLECTION_NAME, {
    vector: embedding,
    limit: 100
  });

    //   chunks es de tipo unknown[]
//   const chunks = searchResult.map(hit => hit.payload?.text || 'Texto no disponible');
  console.log("chunks encontrados: ", searchResult.length);
  const concatenatedChunks =  searchResult.map((hit, i) => {
    const payload = hit.payload || {};
    return `(${i + 1}) [${payload.type || 'Sin tipo'} - ${payload.law_id || 'Sin ID'}]\n${payload.text || 'Texto no disponible'}`;
  }).join('\n\n');

  return {
    question,
    concatenatedChunks,
  };

  const explanation = await askToGemini({
    prompt: `
Eres un asistente jurídico. A continuación se muestra una pregunta del usuario y 100 fragmentos relevantes extraídos de resoluciones judiciales.

Pregunta:
${question}

Fragmentos encontrados:
${searchResult.map((hit, i) => {
  const payload = hit.payload || {};
  return `(${i + 1}) [${payload.type || 'Sin tipo'} - ${payload.law_id || 'Sin ID'}]\n${payload.text || 'Texto no disponible'}`;
}).join('\n\n')}

Explica una posible respuesta basada en los fragmentos.
    `
  });
  console.log(`Fragmentos encontrados: $${searchResult.map((hit, i) => {
    const payload = hit.payload || {};
    return `(${i + 1}) [${payload.type || 'Sin tipo'} - ${payload.law_id || 'Sin ID'}]\n${'Texto de prueba'}`;
  }).join('\n\n')}`);

  return {
    answer: explanation.trim()
  };
}
