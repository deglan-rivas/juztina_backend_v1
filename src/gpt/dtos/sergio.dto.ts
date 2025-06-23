import { IsString } from 'class-validator';



export class SergioDto {

  @IsString()
  readonly prompt: string

}