import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EtlService } from './etl.service';
import { CreateEtlDto } from './dto/create-etl.dto';

@Controller('etl')
export class EtlController {
  constructor(private readonly etlService: EtlService) {}

  @Post('extract')
  extract(@Body() createEtlDto: CreateEtlDto) {
    return this.etlService.extract(createEtlDto);
  }

  @Post('transform-load')
  transform() {
    return this.etlService.transform();
  }
}
