import axios from "axios";

import { GraphQLParams, GraphQLResponse, Hit } from "../entities/etl.entity";

export async function extractData(params: GraphQLParams): Promise<Hit[]> {
  const query = {
    operationName: "Generic",
    variables: { ...params },
    query: `query Generic($fechaIni: String, $fechaFin: String, $institucion: String, $op: String, $paginatedBy: Int, $query: String, $start: Int, $tipoDispositivo: String, $tipoPublicacion: String, $ci: String) {
      results: getGenericPublication(
        fechaIni: $fechaIni
        fechaFin: $fechaFin
        institucion: $institucion
        op: $op
        paginatedBy: $paginatedBy
        query: $query
        start: $start
        tipoDispositivo: $tipoDispositivo
        tipoPublicacion: $tipoPublicacion
        ci: $ci
      ) {
        hits {
          clasificacion1
          clasificacion2
          fechaPublicacion
          nombreDispositivo
          op
          paginas
          rubro
          sector
          sumilla
          tipoDispositivo
          tipoPublicacion
          urlPDF
          urlPortada
        }
      }
    }`
  };

  const res = await axios.post<GraphQLResponse>("https://busquedas.elperuano.pe/api/graphql", query, {
    headers: {
      "content-type": "application/json"
    }
  });

  return res.data?.data?.results?.hits || [];
}