import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EtlService } from './etl.service';
import { EtlController } from './etl.controller';

@Module({
  controllers: [EtlController],
  providers: [EtlService],
  imports: [
    ConfigModule.forRoot(),
  ],
})
export class EtlModule {}
