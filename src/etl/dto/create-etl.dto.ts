import { IsString, IsOptional, IsNumber, IsIn, IsDateString } from 'class-validator';

export class CreateEtlDto {
  /**
   * 1986: JURADO NACIONAL DE ELECCIONES
   * 1988: OFICINA NACIONAL DE PROCESOS ELECTORALES
   * 1989: REGISTRO NACIONAL DE IDENTIFICACION Y ESTADO CIVIL
   * 1993: TRIBUNAL CONSTITUCIONAL
   * 2089: CONSEJO EJECUTIVO DEL PODER JUDICIAL
  */
  @IsString()
  @IsIn(['1986', '1988', '1989', '1993', '2089'])
  institucion: string;

  @IsDateString()
  fechaIni: string; // formato ISO o puedes convertirlo en el servicio

  @IsDateString()
  fechaFin: string;

  // NOTE: temporalmente solo se están tomando "Resoluciones" y "Resoluciones Administrativas" de las "Normas Legales" (NL)
  // considerar a futuro: DJ: Declaración Jurada, NL: Normas Legales, PC: Procesos Constitucionales, etc ...
  @IsString()
  @IsIn(['NL']) 
  tipoPublicacion: string;

  @IsString()
  @IsIn(['RESOLUCION', 'RESOLUCION ADMINISTRATIVA'])
  tipoDispositivo: string;

  @IsOptional()
  @IsNumber()
  start?: number;

  @IsOptional()
  @IsNumber()
  paginatedBy?: number;
}
