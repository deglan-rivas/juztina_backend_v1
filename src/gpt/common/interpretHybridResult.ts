import { askToGemini } from "./askToGemini";

export async function interpretHybridResult({
    neo4jResult,
    semanticResult
  }: {
    neo4jResult: any;
    semanticResult: any;
  }): Promise<string> {
    const hybridPrompt = `
Eres un asistente jurídico. Un usuario ha realizado la siguiente pregunta:

${semanticResult.question}

A continuación se te muestran dos fuentes de datos:
1. Datos estructurados obtenidos desde un grafo de relaciones jurídicas (Neo4j)
2. Fragmentos semánticos obtenidos desde resoluciones reales (Qdrant)

=== Resultado estructurado (Neo4j) ===
Consulta Cypher generada:
${neo4jResult.query}

Resultado:
${neo4jResult.answer}

=== Fragmentos de texto (Qdrant) ===
${semanticResult.concatenatedChunks}

Redacta una respuesta clara, precisa y profesional combinando ambos enfoques.
`;

    const explanation = await askToGemini({ prompt: hybridPrompt });

    return explanation.trim();
  }
  