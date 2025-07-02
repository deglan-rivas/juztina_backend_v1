import { Injectable } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class BackupService {
  private mongoUri = 'mongodb://localhost:27017';

  async createBackupFiles() {
    const client = new MongoClient(this.mongoUri);
    await client.connect();

    // Base de datos y colección 1
    const etlDb = client.db('etl_db');
    const resoluciones = await etlDb.collection('resoluciones').find().toArray();
    console.log('documentos_embed', resoluciones.length);
    await this.writeToFile('resoluciones.etl_db.json', resoluciones);
    console.log('guardado correctamente resoluciones.etl_db.json');

    // Base de datos y colección 2
    const resolDb = client.db('resoluciones');
    const documentosEmbed = await resolDb.collection('documentos_embed').find().toArray();
    console.log('documentos_embed', documentosEmbed.length);
    await this.writeToFile('documentos_embed.resoluciones.json', documentosEmbed);
    console.log('guardado correctamente documentos_embed.resoluciones.json');

    await client.close();

    return {
      message: 'Backup completado correctamente',
      files: ['resoluciones_etl_db.json', 'documentos_embed_resoluciones.json'],
    };
  }

  private async writeToFile(filename: string, data: any[]) {
    // Siempre apunta a src/backup/data incluso en modo producción
    const baseDir = join(process.cwd(), 'src', 'backup', 'data');
    const filePath = join(baseDir, filename);
  
    await fs.mkdir(baseDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
