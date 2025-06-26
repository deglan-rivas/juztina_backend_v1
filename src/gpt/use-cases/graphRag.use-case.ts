// import { MongoClient } from "mongodb";

import { routeQuery } from "../common";

interface Options {
  prompt: string;
}

export const askGraphRag = async( openai: any,  options: Options ) => {

  const { prompt } = options;

  // const userQuestion = "¿Qué resoluciones del 2025 fueron aprobadas por jueces en Lima y citan a la resolución 003-2009-CE-PJ?";
  // const result = await routeQuery(userQuestion);
  const result = await routeQuery(prompt);
  const respuesta = result.answer;
  console.log(respuesta);

  return {
    respuesta
  }
  
}