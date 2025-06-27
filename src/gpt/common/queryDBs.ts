import { askToGemini } from "./askToGemini";
import neo4j from "neo4j-driver";

export interface QueryResult {
    answer: string;
    query?: string;
    prompt?: string;
}

export async function queryNeo4j(question: string): Promise<QueryResult> {
    const prompt = `
Convierte la siguiente pregunta jurídica en una consulta Cypher válida contra el siguiente modelo de grafo:

(:Resolucion {id, tipo, fecha_elaboracion})
  -[:APROBADO_POR]->(:Persona {nombre, cargo})
  -[:INVOLUCRA_A]->(:Persona o :Institucion)
  -[:TIENE_COMPETENCIA_EN]->(:Provincia {nombre})
  -[:CITA_A]->(:Norma {id, tipo})

Pregunta: """${question}"""
Solo devuelve el Cypher como respuesta sin explicaciones ni formato Markdown.
`;
    const driver = neo4j.driver(
        process.env.NEO4J_URI!,
        neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASS!)
    );
    const session = driver.session();

    try {
      const cypherResponse = await askToGemini({prompt});
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

// export async function queryQdrant(question: string): Promise<QueryResult> {
//     // Aquí va el embedding → búsqueda en Qdrant → recuperación del chunk
//     return { answer: "Consulta ejecutada en Qdrant" };
// }

export function combineResults(graphResult: any, semanticResult: any): QueryResult {
    return {
        answer: `${graphResult.answer}\n\nAdemás:\n${semanticResult.answer}`
    };
}
  