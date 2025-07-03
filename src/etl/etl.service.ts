import { Injectable } from '@nestjs/common';
import { CreateEtlDto } from './dto/create-etl.dto';

import { extractData } from "./common/extract/extractor";
import { transformData } from "./common/extract/transformer";
import { fetchResoluciones, saveToMongo } from "./common/extract/mongo";
import { extractAndStoreExtended } from './common/transform/extractAndStoreExtended';

@Injectable()
export class EtlService {
  async extract(createEtlDto: CreateEtlDto) {
    // NOTE: DTO example
    // const params = {
    //   institucion: "2089",
    //   fechaIni: "20250101",
    //   fechaFin: "20250608",
    //   tipoPublicacion: "NL",
    //   tipoDispositivo: "RESOLUCION ADMINISTRATIVA",
    //   // TODO estos 2 son los únicos opcionales que deben venir del dto
    //   start: 0,
    //   paginatedBy: 1000,
    // };

    const {
      institucion,
      fechaIni,
      fechaFin,
      tipoPublicacion,
      tipoDispositivo,
      start = 0,
      paginatedBy = 1000,
    } = createEtlDto;

    const params = {
      institucion,
      fechaIni,
      fechaFin,
      tipoPublicacion,
      tipoDispositivo,
      start,
      paginatedBy,
    };
  
    console.time("total");
  
    console.time("extractData");
    const raw = await extractData(params);
    console.timeEnd("extractData");
  
    console.time("transformData");
    const transformed = await transformData(raw);
    console.timeEnd("transformData");
    // console.log("transformed: ", transformed);
  
    console.time("saveToMongo");
    await saveToMongo(transformed);
    console.timeEnd("saveToMongo");
  
    console.timeEnd("total");
    return {
      message: 'This action extracts correctly html documents from https://busquedas.elperuano.pe/'
    };
  }

  async transform() {
    let resoluciones: any[] = [];
    try {   
        resoluciones = await fetchResoluciones(2);
        console.log("Resoluciones recuperadas:", resoluciones.length);
        // console.log("Primeras 5 resoluciones:", resoluciones.slice(0, 5));
    } catch (err) {
        console.error("Error al recuperar resoluciones:", (err as Error).message);
    }
    
    console.time("extractAndStoreExtended");
    // resoluciones.forEach(async (resolucion) => await extractAndStoreExtended(resolucion));
    // await Promise.all(resoluciones.map((resolucion) => extractAndStoreExtended(resolucion)));
    for (const resolucion of resoluciones) {
        // await extractAndStoreExtended(resolucion);
        await extractAndStoreExtended(resolucion);
    }
    console.timeEnd("extractAndStoreExtended");
    // return "";
    return 'This action transforms a etl';
  }

}
