import * as fs from 'fs';
import * as path from 'path';

import { Injectable } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { QdrantClient } from '@qdrant/js-client-rest';
import neo4j, { Driver } from 'neo4j-driver';

@Injectable()
export class SeedService {
  private mongoUri = process.env.MONGO_URI;
  private mongoDbName = process.env.MONGO_DBNAME_PROCESS_DOCUMENTS;
  private mongoCollection = process.env.MONGO_DBCOLLECTION_PROCESS_DOCUMENTS;
  // TODO no usar el mongoClient, mejor abrir y cerrar una conexión por operación pues si usamos el this.mongoClient, entonces el collection.insertMany(documentos) fallará pues el resetAllDatabases lo cerrará porque no le puse await xd
  private mongoClient = new MongoClient(this.mongoUri);

  private qdrant = new QdrantClient({ url: process.env.QDRANT_HOST });
  private qdrantCollection = process.env.QDRANT_COLLECTION;

  private neo4jDriver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASS)
  );

  private NEO4J_MAX_RETRIES = 5;
  private NEO4J_WAIT_MS = 2000;

  async seedAll() {
    // TODO validar si el archivo .json existe antes de poblar la mongoDB
    // TODO dividirlo en batches de 1000 para mongoDB y qdrant pues son independientes, para Neo4j sí hay que hacerlo secuencial para que se creen las relaciones correctamente

    // 1. Limpiar todas las DB's
    await this.resetAllDatabases();



    // 2. Cargar datos desde el archivo JSON local
    const filePath = path.join(process.cwd(), 'src', 'backup', 'data', 'documentos_embed.resoluciones.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const documentos = JSON.parse(rawData);



    // 3. Insertar datos en MongoDB
    // const mongo = new MongoClient(this.mongoUri);
    const mongo = this.mongoClient;
    await mongo.connect();
    const db = mongo.db(this.mongoDbName);
    const collection = db.collection(this.mongoCollection);

    console.time("insertManyInMongoDB");
    await collection.insertMany(documentos);
    console.timeEnd("insertManyInMongoDB");
    console.log(`✅ MongoDB: ${documentos.length} documentos insertados en '${this.mongoCollection}'`);
    await mongo.close();



    // 4. Poblar Qdrant
    await this.qdrant.createCollection(this.qdrantCollection, {
      vectors: { size: 768, distance: "Cosine" }
    }).catch(() => {}); // ignora si ya existe

    const allChunks = documentos.flatMap(doc => doc.chunksWithEmbeddings || []);
    console.log(`📦 Total de chunks a insertar en Qdrant: ${allChunks.length}`);

    const BATCH_SIZE = 100;
    let inserted = 0;

    console.time("insertManyInQdrant");
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);

      try {
        await this.qdrant.upsert(this.qdrantCollection, { points: batch });
        inserted += batch.length;
        console.log(`✅ Insertado batch ${(i / BATCH_SIZE) + 1} con ${batch.length} chunks`);
      } catch (err) {
        console.warn(`⚠️ Error en el batch ${(i / BATCH_SIZE) + 1}:`, err.message);
      }
    }
    console.timeEnd("insertManyInQdrant");

    console.log(`🎯 Total de chunks insertados en Qdrant: ${inserted}`);



    // 5. Poblar Neo4j
    console.log('⏳ Insertando grafos en Neo4j (secuencial)...');

    const driver = this.neo4jDriver;
    const documentosConEntidades = documentos.filter((d) => d.entidades);
    
    let totalGrafos = 0;
    
    console.time("🕒 Tiempo total Neo4j");
    
    for (const doc of documentosConEntidades) {
      try {
        await this.buildGraphFromEntities(doc.entidades, driver);
        totalGrafos++;
        console.log(`✅ Insertado grafo ${totalGrafos}/${documentosConEntidades.length}`);
      } catch (error) {
        console.warn(`⚠️ Error en grafo de '${doc.id}':`, error.message);
      }
    }
    
    console.timeEnd("🕒 Tiempo total Neo4j");
    console.log(`🎯 Total de grafos insertados en Neo4j: ${totalGrafos}`);

    return { message: 'Seeding completado' };
  }

  private async resetAllDatabases() {
    // 🧹 1. Limpiar MongoDB
    // const mongo = new MongoClient(this.mongoUri);
    const mongo = this.mongoClient;
    await mongo.connect();
    const db = mongo.db(this.mongoDbName);
    await db.dropDatabase();
    console.log(`✅ MongoDB: base '${this.mongoDbName}' eliminada`);
    await mongo.close();
  
    // 🧹 2. Limpiar Qdrant
    // const qdrant = new QdrantClient({ url: process.env.QDRANT_HOST! });
    const qdrant = this.qdrant;
    try {
      await qdrant.deleteCollection(process.env.QDRANT_COLLECTION!);
      console.log(`✅ Qdrant: colección '${process.env.QDRANT_COLLECTION}' eliminada`);
    } catch (err) {
      console.warn("⚠️ Qdrant: no se pudo eliminar (quizás ya no existe)");
    }
  
    // 🧹 3. Limpiar Neo4j
    // const driver = neo4j.driver(
    //   process.env.NEO4J_URI!,
    //   neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASS!)
    // );
    const driver = this.neo4jDriver;
    try {
      await this.waitForNeo4jReady(driver);
      const session = driver.session();
      await session.run("MATCH (n) DETACH DELETE n");
      await session.close();
      console.log("✅ Neo4j: todos los nodos y relaciones eliminados");
    } catch (err) {
      if (err instanceof Error) {
        console.error("❌ Error al conectar con Neo4j:", err.message);
      } else {
        console.error("❌ Error desconocido al conectar con Neo4j:", err);
      }
    }
    // } finally {
    //   await driver.close();
    // }
  }
  
  private async waitForNeo4jReady(driver: Driver) {
    for (let i = 0; i < this.NEO4J_MAX_RETRIES; i++) {
      try {
        const session = driver.session();
        // TODO descomentar cuando se use una base de datos específica -> investigar si realmente se puede hacer esto pues entiendo que neo4j no tienes DB's
        // const session = driver.session({ database: process.env.NEO4J_DBNAME });
        await session.run("RETURN 1");
        await session.close();
        return true;
      } catch (err) {
        console.log(`⏳ Esperando que Neo4j esté listo (${i + 1}/${this.NEO4J_MAX_RETRIES})...`);
        await new Promise(r => setTimeout(r, this.NEO4J_WAIT_MS));
      }
    }
    throw new Error("❌ Neo4j no respondió a tiempo.");
  }

  private async buildGraphFromEntities(entities: any, driver: Driver) {
    /**
     * Modelado en cypher - neo4j
     (:Resolucion {id: "000040-2025-P-CE-PJ", tipo: "Resolución Administrativa", fecha_elaboracion: date("2025-04-15")})
    -[:APROBADO_POR]->
      (:Persona {nombre: "Janet Tello Gilardi", cargo: "Presidenta"})
    -[:INVOLUCRA_A]->
      (:Persona {nombre: "Víctor Roberto Prado Saldarriaga", cargo: "Juez titular de la Corte Suprema de Justicia de la República"})
    -[:INVOLUCRA_A]->
      (:Institucion {nombre: "Consejo Ejecutivo del Poder Judicial"})
    -[:TIENE_COMPETENCIA_EN]->
      (:Provincia {nombre: "Lima"})
    -[:CITA_A]->
      (:Norma {id: "000495-2025-GG-PJ", tipo: "Oficio"})
      * Traducido a LLM:
      La resolución administrativa 000040-2025-P-CE-PJ fue aprobada por Janet Tello Gilardi. Involucra al Consejo Ejecutivo del Poder Judicial y al juez Víctor Prado. Tiene competencia en la provincia de Lima y cita a la norma 000495-2025-GG-PJ (tipo Oficio).
     */
    const session = driver.session();
  
    const {
      aprobado_por,
      personas_involucradas = [],
      instituciones = [],
      provincias = [],
      fecha_elaboracion,
      norma_juridica_actual,
      normas_juridicas_citadas = [],
    } = entities;
  
    try {
      const tx = session.beginTransaction();
  
      // 1. Crear nodo principal de la norma jurídica actual
      await tx.run(
        `
        MERGE (n:Resolucion {id: $id})
        SET n.tipo = $tipo,
            n.fecha_elaboracion = date($fecha_elaboracion)
        `,
        {
          id: norma_juridica_actual.id,
          tipo: norma_juridica_actual.tipo,
          fecha_elaboracion,
        }
      );
  
      // 2. Aprobado por (persona única)
      if (aprobado_por?.nombre) {
        await tx.run(
          `
          MERGE (p:Persona {nombre: $nombre})
          SET p.cargo = $cargo
          MERGE (n:Resolucion {id: $resolucion_id})
          MERGE (n)-[:APROBADO_POR]->(p)
          `,
          {
            nombre: aprobado_por.nombre,
            cargo: aprobado_por.cargo,
            resolucion_id: norma_juridica_actual.id,
          }
        );
      }
  
      // 3. Personas involucradas
      for (const persona of personas_involucradas) {
        await tx.run(
          `
          MERGE (p:Persona {nombre: $nombre})
          SET p.cargo = $cargo
          MERGE (n:Resolucion {id: $resolucion_id})
          MERGE (n)-[:INVOLUCRA_A]->(p)
          `,
          {
            nombre: persona.nombre,
            cargo: persona.cargo,
            resolucion_id: norma_juridica_actual.id,
          }
        );
      }
  
      // 4. Instituciones
      for (const institucion of instituciones) {
        await tx.run(
          `
          MERGE (i:Institucion {nombre: $nombre})
          MERGE (n:Resolucion {id: $resolucion_id})
          MERGE (n)-[:INVOLUCRA_A]->(i)
          `,
          {
            nombre: institucion,
            resolucion_id: norma_juridica_actual.id,
          }
        );
      }
  
      // 5. Provincias
      for (const provincia of provincias) {
        await tx.run(
          `
          MERGE (p:Provincia {nombre: $nombre})
          MERGE (n:Resolucion {id: $resolucion_id})
          MERGE (n)-[:TIENE_COMPETENCIA_EN]->(p)
          `,
          {
            nombre: provincia,
            resolucion_id: norma_juridica_actual.id,
          }
        );
      }
  
      // 6. Normas jurídicas citadas
      for (const citada of normas_juridicas_citadas) {
        await tx.run(
          `
          MERGE (c:Norma {id: $id})
          SET c.tipo = $tipo
          MERGE (n:Resolucion {id: $resolucion_id})
          MERGE (n)-[:CITA_A]->(c)
          `,
          {
            id: citada.id,
            tipo: citada.tipo,
            resolucion_id: norma_juridica_actual.id,
          }
        );
      }
  
      await tx.commit();
    } catch (error) {
      console.error('Error construyendo el grafo:', error);
    } finally {
      await session.close();
    }
  }

}
