import { Driver } from "neo4j-driver";

export async function buildGraphFromEntities(entities: any, driver: Driver) {
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