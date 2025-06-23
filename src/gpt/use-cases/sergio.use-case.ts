// import OpenAI from 'openai';

import { askGeminiWithContext } from "./askGemini";
// import { retrieveContextFromQuery } from "./retrieval2";
import { retrieveRelevantChunks } from "./retrieval2";

interface Options {
  prompt: string;
}

// import { retrieveContextFromQuery } from './retrieval2';
// import { askGeminiWithContext } from './askGemini';


export const sergioUseCase = async( openai: any,  options: Options ) => {

  const { prompt } = options;

  // const jsonResp = JSON.parse(completion.choices[0].message.content);
  // return jsonResp;

  // const pregunta = "¿En qué cortes se está implementando el Expediente Judicial Electrónico durante el 2025?";
  // const contexto = "";
  const contexto = await retrieveContextFromQuery(prompt);
  return {
    contexto,
  };

}

import { MongoClient } from "mongodb";

export async function retrieveContextFromQuery(query: string) {
  const chunks = await retrieveRelevantChunks(query);
  const mongo = new MongoClient(process.env.MONGO_URI!);
  await mongo.connect();
  const db = mongo.db("resoluciones");

  // Extraer partes seguras de todos los chunks
  const regexes = chunks.map(chunk => {
    const snippet = (chunk.text as string).slice(0, 100);
    return new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  });

  // Usamos $or para buscar coincidencias con cualquier snippet
  const matches = await db.collection("documentos_embed").find({
    $or: regexes.map(rgx => ({ "chunks.chunk": { $regex: rgx } }))
  }).toArray();

  await mongo.close();

  // Parsear solo id y plainText, asegurando que no haya duplicados por id
  const uniqueDocs = new Map<string, { id: string; plainText: string }>();

  for (const doc of matches) {
    if (doc.id && doc.plainText && !uniqueDocs.has(doc.id)) {
      uniqueDocs.set(doc.id, { id: doc.id, plainText: doc.plainText });
    }
  }

  const resultSet = Array.from(uniqueDocs.values());
  return resultSet;
}
