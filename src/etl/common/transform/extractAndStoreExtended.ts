import neo4j from "neo4j-driver";

import { chunkAndEmbed } from "./chunkAndEmbed";
import { geminiStructuredEntityExtractor } from "./geminiStructuredEntityExtractor";
import { storeDocumentInMongo } from "./storeDocumentInMongo";
import { buildGraphFromEntities } from "./buildGraphFromEntities";

export async function extractAndStoreExtended(parseHTML: any) {
    const {body: parsed} = parseHTML;
    // const chunksWithEmbeddings = await chunkAndEmbed(parsed.plainText);
    const input = parsed.id;
    const regex = /^N°\s+/;
    const law_id = input.replace(regex, '');
    
    console.log(parsed.op)
    console.time("GeminiStructuredEntityExtractor");
    const entities = await geminiStructuredEntityExtractor(parsed);
    console.timeEnd("GeminiStructuredEntityExtractor");
    console.log('GeminiStructuredEntityExtractor terminado')
    console.log("entities", entities);
  
    console.time("chunkAndEmbed");
    const chunksWithEmbeddings = await chunkAndEmbed(parsed.plainText, entities.norma_juridica_actual.id ?? law_id, entities.norma_juridica_actual.tipo ?? '');
    console.timeEnd("chunkAndEmbed");
    console.log('chunkAndEmbed terminado')
  
    // Guardar en MongoDB
    console.time("storeDocumentInMongo");
    await storeDocumentInMongo({
      ...parsed,
      chunksWithEmbeddings,
      entidades: entities
    });
    console.timeEnd("storeDocumentInMongo");
    console.log('storeDocumentInMongo terminado')
  
    // Guardar en Neo4j
    const driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASS!)
    );
    // await buildGraphFromEntities(parsed, entities, driver);
    console.time('buildGraphFromEntities');
    await buildGraphFromEntities(entities, driver);
    await driver.close();
    console.timeEnd('buildGraphFromEntities');
    console.log('buildGraphFromEntities terminado')
  }