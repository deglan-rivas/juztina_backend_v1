export class Etl {}

export interface GraphQLParams {
    fechaIni: string;
    fechaFin: string;
    institucion: string;
    tipoDispositivo: string;
    tipoPublicacion: string;
    start: number;
}
  
export interface GraphQLResponse {
    data: {
        results: {
        hits: Hit[]
        };
    }
}
  
export interface Hit {
    clasificacion1: string;
    clasificacion2: string;
    fechaPublicacion: string;
    nombreDispositivo: string;
    op: string;
    paginas: string;
    rubro: string;
    sector: string;
    sumilla: string;
    tipoDispositivo: string;
    tipoPublicacion: string;
    urlPDF: string;
    urlPortada: string;
}