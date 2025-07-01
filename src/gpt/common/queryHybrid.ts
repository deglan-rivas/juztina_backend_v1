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

import neo4j from "neo4j-driver";

export async function queryHybridNeo4j(question: string): Promise<any> {
  const prompt = `
Convierte la siguiente pregunta jurídica en una consulta Cypher válida contra el siguiente modelo de grafo:

(:Resolucion {id, tipo, fecha_elaboracion})
  -[:APROBADO_POR]->(:Persona {nombre, cargo})
  -[:INVOLUCRA_A]->(:Persona o :Institucion)
  -[:TIENE_COMPETENCIA_EN]->(:Provincia {nombre})
  -[:CITA_A]->(:Norma {id, tipo})

Pregunta: """${question}"""
Esta primera consulta es para filtrar los campos "id" y "tipo" de las normas jurídicas ":Resolucion" y ":Norma", ya que más adelante se utilizará estos campos para filtrar una búsqueda semántica en Qdrant. Límitate a utilizar la información proporcionada en el modelo de grafo que te envié arriba; es decir, no inventes nuevos nodos, relaciones ni propiedades. Recuerda que el resultado de ejecutar el query de Cypher debe ser un arreglo de Resoluciones con sus respectivos campos "id" y "tipo". 
Por ejemplo: si la pregunta es ¿Qué resoluciones del 2025 emitidas en Lima citan normas de tipo 'Oficio' sobre “plan estratégico”?, entonces . En esta estapa debemos enfocarnos en extraer los campos de "id" de las Resoluciones la cuál consta de la primera parte de la pregunta (fecha_elaboracion 2025, Provincia Lima, Normas Oficio) ,y NO nos enfocaremos en realizar ninguna búsqueda semántica que en este ejemplo sería“plan estratégico” (por ejm: contains).
Considera que la Resolución tiene almacenada su fecha como tipo 'date' de esta forma y no como string: (:Resolucion {fecha_elaboracion: 2025-06-04, tipo: "Resolución Administrativa", id: "000078-2025-P-CE-PJ"})
Asegúrate que tu query de Cypher no de error de sintaxis y que sea válido para ejecutarse en Neo4j.
El query debe terminar con la siguiente cláusula: 'RETURN r.id AS resolucionId, r.tipo AS resolucionTipo'
Finalmente, solo devuelve el Cypher como respuesta sin explicaciones ni formato Markdown que comienza con \`\`\`cypher y termina con \`\`\`.
`;
    const driver = neo4j.driver(
        process.env.NEO4J_URI!,
        neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASS!)
    );
    const session = driver.session();

    try {
      let cypherResponse = await askToGemini({prompt});
      if (cypherResponse.startsWith('```cypher') || cypherResponse.startsWith('```')) {
        cypherResponse = cypherResponse.replace(/^```cypher\s*|```$/g, '').trim();
      }
      console.log("Cypher Response:", cypherResponse);

      const result = await session.run(cypherResponse);

      const rows = result.records.map(record => record.toObject());
      await session.close();

      return {
        answer: JSON.stringify(rows, null, 2),
        query: cypherResponse,
        prompt
      };
    } catch (err) {
      console.error("Error en queryNeo4j:", err);
      return {
        answer: "Error al ejecutar la consulta en Neo4j: " + err.message
      };
    }
}

import { qdrant } from './qdrantClient';
import { getEmbedding } from './getEmbedding';

import * as dotenv from "dotenv";
dotenv.config();

// export async function queryQdrant(question: string): Promise<{ answer: string }> {
export async function queryHybridQdrant(question: string, stringfiedJSON: string): Promise<any> {
  const COLLECTION_NAME = process.env.QDRANT_COLLECTION!;;
  const embedding = await getEmbedding(question);

  const validJSON = JSON.parse(stringfiedJSON);

  // Creamos los filtros OR por cada combinación
  const should = validJSON.map((item: any) => ({
    must: [
      {
        key: 'law_id',
        match: { value: item.resolucionId }
      },
      {
        key: 'type',
        match: { value: item.resolucionTipo }
      }
    ]
  }));

  const searchParams = {
    vector: embedding,
    limit: 100,
    filter: {
      should,
      must: [],
      must_not: []
    }
  };

  const searchResult = await qdrant.search(COLLECTION_NAME, searchParams);

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

}