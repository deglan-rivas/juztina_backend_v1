// import OpenAI from 'openai';

import { askGeminiWithContext } from "./askGemini";
// import { retrieveContextFromQuery } from "./retrieval2";
import { getRelatedGraphNodes, mergeContextForLLM, retrieveRelevantChunks } from "./retrieval2";

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

export const getSemanticContext = async( openai: any,  options: Options ) => {

  const { prompt } = options;

  const contexto = await retrieveAllContextFromQuery(prompt);
  console.log("contexto ", contexto);
  // return {
  //   contexto,
  // };
  const respuesta = await askGeminiWithContext(contexto, prompt);
  return {
    respuesta,
  }
  
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

export async function retrieveAllContextFromQuery(query: string) {
  const chunks = await retrieveRelevantChunks(query);

  const mongo = new MongoClient(process.env.MONGO_URI!);
  await mongo.connect();
  const db = mongo.db("resoluciones");

  // Crear regexes seguros desde los chunks
  const regexes = chunks.map(chunk => {
    const snippet = (chunk.text as string).slice(0, 100);
    return new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  });

  // Buscar todos los documentos que hagan match con alguno de los snippets
  const matches = await db.collection("documentos_embed").find({
    $or: regexes.map(rgx => ({ "chunks.chunk": { $regex: rgx } }))
  }).toArray();

  await mongo.close();

  // Extraer solo id y plainText y eliminar duplicados por id
  const uniqueDocs = new Map<string, { id: string; plainText: string }>();
  for (const doc of matches) {
    if (doc.id && doc.plainText && !uniqueDocs.has(doc.id)) {
      uniqueDocs.set(doc.id, { id: doc.id, plainText: doc.plainText });
    }
  }

  const matchedDocs = Array.from(uniqueDocs.values());

  // Obtener todos los nodos relacionados desde el grafo
  const allGraphNodes = [];
  for (const doc of matchedDocs) {
    const resolucionId = doc.id.replace(/^Nº\s*/, "");
    const nodes = await getRelatedGraphNodes(resolucionId);
    allGraphNodes.push(...nodes);
  }

  // Fusionar los chunks + grafos para el LLM
  const context = mergeContextForLLM(chunks, allGraphNodes);

  return context;
}