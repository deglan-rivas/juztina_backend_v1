import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GptModule } from './gpt/gpt.module';
import { SeedModule } from './seed/seed.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    GptModule,
    SeedModule,
  ]
})
export class AppModule {}
