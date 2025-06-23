import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenAI } from "@google/genai";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";
import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const qdrant = new QdrantClient({ url: process.env.QDRANT_HOST! });
const COLLECTION = process.env.QDRANT_COLLECTION!;

export async function retrieveRelevantChunks(query: string, topK = 5) {
  // const model = ai.getGenerativeModel({ model: "text-embedding-004" });
  const result = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: [query],
    config: { outputDimensionality: 768 }
  });

  const queryEmbedding = result.embeddings![0].values!;
  const hits = await qdrant.search(COLLECTION, {
    vector: queryEmbedding,
    limit: topK,
    with_payload: true
  });

  return hits.map(hit => ({
    text: hit.payload?.text,
    score: hit.score
  }));
}

export async function getRelatedGraphNodes(resolucionId: string) {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASS!)
  );
  const session = driver.session();

  const result = await session.run(
    `MATCH (r:Resolucion {id: $id})-[rel]->(n)
     RETURN type(rel) AS tipoRelacion, properties(rel) AS propiedades, labels(n) AS labels, n`,
    { id: resolucionId }
  );

  await session.close();
  await driver.close();

  return result.records.map(record => ({
    relacion: record.get("tipoRelacion"),
    propiedades: record.get("propiedades"),
    nodo: record.get("n").properties,
    tipoNodo: record.get("labels")[0]
  }));
}

export function mergeContextForLLM(chunks: any[], graph: any[]) {
  const textoChunks = chunks.map((c, i) => `# Chunk ${i + 1}
${c.text}`).join("\n\n");
  const textoGraph = graph.map((r, i) => `# Relación ${i + 1}
(${r.tipoNodo}) ${JSON.stringify(r.nodo)} <-[${r.relacion}]`).join("\n\n");
  return `${textoChunks}\n\n${textoGraph}`;
}

export async function retrieveContextFromQuery(query: string) {
  const chunks = await retrieveRelevantChunks(query);
  console.log("chunks ", chunks)
  const mongo = new MongoClient(process.env.MONGO_URI!);
  await mongo.connect();
  const db = mongo.db("resoluciones");

  const snippet = (chunks[0].text as string).slice(0, 100); // usa una parte segura del texto
  const firstMatch = await db.collection("documentos_embed").findOne({
  "chunks.chunk": { $regex: new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }
});
  // console.log(firstMatch)
  
  await mongo.close();
  const rawId = firstMatch?.id;
  // console.log(rawId);
  const resolucionId = rawId?.replace(/^Nº\s*/, "");
  // console.log(resolucionId)
  const graph = resolucionId ? await getRelatedGraphNodes(resolucionId) : [];
  // console.log(graph)

  return mergeContextForLLM(chunks, graph);
}

