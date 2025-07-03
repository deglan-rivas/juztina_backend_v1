import { Injectable } from '@nestjs/common';
import { CreateEtlDto } from './dto/create-etl.dto';

import { extractData } from "./common/extractor";
import { transformData } from "./common/transformer";
import { saveToMongo } from "./common/mongo";

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
    return 'This action transforms a etl';
  }

}
