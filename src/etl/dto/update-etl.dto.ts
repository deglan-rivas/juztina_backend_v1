import { PartialType } from '@nestjs/mapped-types';
import { CreateEtlDto } from './create-etl.dto';

export class UpdateEtlDto extends PartialType(CreateEtlDto) {}
