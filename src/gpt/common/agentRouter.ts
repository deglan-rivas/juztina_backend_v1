import { detectQueryIntent, splitIntention } from "./detectQueryIntent";
import { interpretCypherResult } from "./interpretCypherResult";
import { interpretHybridResult } from "./interpretHybridResult";
import { interpretQdrantResult } from "./interpretQdrantResult";
import { queryNeo4j, combineResults } from "./queryDBs";
import { queryHybrid, queryHybridNeo4j, queryHybridQdrant } from "./queryHybrid";
import { queryQdrant } from "./queryQdrant";

export async function routeQuery(question: string) {
    // const { queryType, reason } = await detectQueryIntent(question);
    const queryType = await detectQueryIntent(question);
  
    console.log(`Ruta detectada: ${queryType}`);
    // console.log(`Motivo: ${reason}`);
  
    switch (queryType) {
      case "graph":
        // return await queryNeo4j(question);
        const neo4jResult = await queryNeo4j(question);
        // TODO recuperar el contexto la función "queryNeo4j" y combinarlo con el argumento "question" para enviarlo como prompt a Gemini y que nos dé una respuesta más completa
        const explanation = await interpretCypherResult({
            question,
            prompt: neo4jResult.prompt,
            cypherQuery: neo4jResult.query,
            rawResult: JSON.parse(neo4jResult.answer)
        });
        
        return {
            answer: explanation,
            route: "graph"
        };
  
      case "semantic":
        // const semanticResult = await queryQdrant(question);
        const qdrantResult = await queryQdrant(question);
        // console.log("qdrantResult ", qdrantResult);
        const qdrantExplanation = await interpretQdrantResult(qdrantResult);
        // console.log("qdrantExplanation ", qdrantExplanation);
        // return { answer: semanticResult.answer, route: 'semantic' };
        return { answer: qdrantExplanation, route: 'semantic' };

        case "hybrid":
          // TODO el caso hybrid no debería buscar en ambas DB's en paralelo, sino que primero filtrar usando los grafos, extraer el type con id y luego usar ambos para filtrar la búsqueda vectorial de embeddings limitándose a todos los chunks que coincidan con el type y el id
      //     const graphResult = await queryNeo4j(question);
      //     const semanticResult = await queryQdrant(question);
      //     return combineResults(graphResult, semanticResult);
          // const hybridResult = await queryHybrid(question);
          // const hybridExplanation = await interpretHybridResult(hybridResult);
          // return { answer: hybridExplanation, route: 'hybrid' };

          // neo4j - tengo pregunta, query y resultados en formato especial y solo devolviendo id's con type
          // no hay que interpretar el resultado
          // semánticamente, buscar usando ese filtrado -> devolver chunks concatenados
          // interpretar usando la pregunta original, query y resultados de neo4j y chunks concatenados de Qdrant
          const hybridIntention = await splitIntention(question);
          const hybridNeo4jResult = await queryHybridNeo4j(hybridIntention.graphQuestion);
          const hybridQdrantResult = await queryHybridQdrant(hybridIntention.semanticQuestion, hybridNeo4jResult.answer);
          console.log("Hybrid Result:", hybridQdrantResult);
          const hybridExplanation = await interpretHybridResult({neo4jResult: hybridNeo4jResult, semanticResult: hybridQdrantResult});
          return { answer: hybridExplanation, route: 'hybrid' };

      case "unknown":
      default:
        return {
          answer: "No puedo responder esa pregunta porque no está relacionada con el dominio legal o judicial.",
        };
    }
  }
  