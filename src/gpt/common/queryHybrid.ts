import { queryNeo4j } from './queryDBs';
import { queryQdrant } from './queryQdrant';
import { askToGemini } from './askToGemini';

// export async function queryHybrid(question: string): Promise<string> {
export async function queryHybrid(question: string): Promise<any> {
  const [neo4jResult, semanticResult] = await Promise.all([
    queryNeo4j(question),
    queryQdrant(question)
  ]);

  return {
    neo4jResult,
    semanticResult
  }

  const hybridPrompt = `
Eres un asistente jurídico. Un usuario ha realizado la siguiente pregunta:

${question}

A continuación se te muestran dos fuentes de datos:
1. Datos estructurados obtenidos desde un grafo de relaciones jurídicas (Neo4j)
2. Fragmentos semánticos obtenidos desde resoluciones reales (Qdrant)

=== Resultado estructurado (Neo4j) ===
Prompt original:
${neo4jResult.prompt}

Consulta Cypher generada:
${neo4jResult.query}

Resultado:
${neo4jResult.answer}

=== Fragmentos de texto (Qdrant) ===
${semanticResult.chunks.map((chunk, i) => `(${i + 1}) ${chunk}`).join('\n\n')}

Redacta una respuesta clara, precisa y profesional combinando ambos enfoques.
`;

  const explanation = await askToGemini({ prompt: hybridPrompt });

  return explanation.trim();
}
