import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GptModule } from './gpt/gpt.module';
import { SeedModule } from './seed/seed.module';
import { BackupModule } from './backup/backup.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    GptModule,
    SeedModule,
    BackupModule,
  ]
})
export class AppModule {}
