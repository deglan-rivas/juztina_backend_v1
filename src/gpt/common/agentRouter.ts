import { detectQueryIntent } from "./detectQueryIntent";
import { interpretCypherResult } from "./interpretCypherResult";
import { queryNeo4j, queryQdrant, combineResults } from "./queryDBs";

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
        return await queryQdrant(question);
  
    //   case "hybrid":
    //     const graphResult = await queryNeo4j(question);
    //     const semanticResult = await queryQdrant(question);
    //     return combineResults(graphResult, semanticResult);
  
      case "unknown":
      default:
        return {
          answer: "No puedo responder esa pregunta porque no está relacionada con el dominio legal o judicial.",
        };
    }
  }
  