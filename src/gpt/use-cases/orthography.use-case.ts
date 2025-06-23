// import OpenAI from 'openai';

import { askGeminiWithContext } from "./askGemini";
import { retrieveContextFromQuery } from "./retrieval2";

interface Options {
  prompt: string;
}

// import { retrieveContextFromQuery } from './retrieval2';
// import { askGeminiWithContext } from './askGemini';


export const orthographyCheckUseCase = async( openai: any,  options: Options ) => {

  const { prompt } = options;

  // const jsonResp = JSON.parse(completion.choices[0].message.content);
  // return jsonResp;

  // const pregunta = "¿En qué cortes se está implementando el Expediente Judicial Electrónico durante el 2025?";
  // const contexto = "";
  const contexto = await retrieveContextFromQuery(prompt);
  console.log("📍 Contexto recuperado de las bases de datos:\n", contexto);
  const respuesta = await askGeminiWithContext(contexto, prompt);
  console.log("🧠 Respuesta de Gemini:\n", respuesta);
  return {
    message: respuesta
  };

}