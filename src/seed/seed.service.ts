import { Injectable } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { QdrantClient } from '@qdrant/js-client-rest';
import neo4j from 'neo4j-driver';

@Injectable()
export class SeedService {
  private mongoUri = 'mongodb://localhost:27017';
  private mongoDbName = 'etl_db';
  private mongoCollection = 'resoluciones';

  private qdrant = new QdrantClient({ url: 'http://localhost:6333' });
  private neo4jDriver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', 'test')
  );

  async seedAll() {
    // 1. Conectar a Mongo
    const client = new MongoClient(this.mongoUri);
    await client.connect();
    const db = client.db(this.mongoDbName);
    const collection = db.collection(this.mongoCollection);

    // 2. Borrar datos
    await collection.deleteMany({});
    await this.qdrant.deleteCollection('nombre_de_tu_coleccion');
    const neoSession = this.neo4jDriver.session();
    await neoSession.run('MATCH (n) DETACH DELETE n');
    await neoSession.close();

    // 3. Insertar datos dummy a Mongo si es necesario (puedes omitir si ya hay)
    // await collection.insertMany([{...}, {...}]);

    // 4. Leer datos de Mongo
    const docs = await collection.find().toArray();

    // 5. Poblar Qdrant
    for (const doc of docs) {
      await this.qdrant.upsert('nombre_de_tu_coleccion', {
        points: [
          {
            id: doc._id.toString(),
            vector: doc.vector || this.generateDummyVector(),
            payload: {
              text: doc.texto || '',
              law_id: doc.law_id,
              type: doc.type,
            },
          },
        ],
      });
    }

    // 6. Poblar Neo4j
    const session = this.neo4jDriver.session();
    for (const doc of docs) {
      await session.run(
        `MERGE (r:Resolucion {id: $id, tipo: $tipo, fecha_elaboracion: $fecha})
         MERGE (p:Persona {nombre: $nombre, cargo: $cargo})
         MERGE (prov:Provincia {nombre: $provincia})
         MERGE (r)-[:APROBADO_POR]->(p)
         MERGE (r)-[:TIENE_COMPETENCIA_EN]->(prov)`,
        {
          id: doc.law_id,
          tipo: doc.type,
          fecha: doc.fecha_elaboracion,
          nombre: doc.aprobado_por?.nombre,
          cargo: doc.aprobado_por?.cargo,
          provincia: doc.provincia,
        }
      );
    }
    await session.close();
    await client.close();

    return { message: 'Seeding completado' };
  }

  private generateDummyVector(): number[] {
    return Array.from({ length: 768 }, () => Math.random());
  }
}
