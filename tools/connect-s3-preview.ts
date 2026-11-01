/**
 * @fileoverview Подключение Railway S3 к локальному проекту для просмотра большого списка файлов.
 * Ключи берутся из временного JSON, шифруются в локальной БД и не печатаются.
 * Запуск: npx tsx --tsconfig tsconfig.node.json tools/connect-s3-preview.ts <json> <projectId>
 */
import 'dotenv/config';
import { readFile, appendFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { Client } from 'pg';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { lookup } from 'mime-types';
import { encryptCredentials } from '../server/storage/storage-secrets';

/** Идентификатор отдельного хранилища предпросмотра. */
const STORAGE_ID = 'railway-s3-preview';

/**
 * Индексирует реальные объекты в локальной БД без копирования содержимого и записи в бакет.
 * @returns Завершение подключения
 */
async function main(): Promise<void> {
  const [input, projectArg] = process.argv.slice(2);
  const projectId = Number(projectArg);
  if (!input || !Number.isInteger(projectId)) throw new Error('Нужны JSON настроек и ID проекта');
  const databaseUrl = new URL(process.env.DATABASE_URL!);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(databaseUrl.hostname)) throw new Error('Разрешена только локальная БД');
  const settings = JSON.parse((await readFile(input, 'utf8')).replace(/^\uFEFF/, ''));
  if (!process.env.STORAGE_ENCRYPTION_KEY) {
    process.env.STORAGE_ENCRYPTION_KEY = randomBytes(32).toString('hex');
    await appendFile('.env', `\n# Ключ шифрования локальных подключений хранилищ\nSTORAGE_ENCRYPTION_KEY=${process.env.STORAGE_ENCRYPTION_KEY}\n`);
  }
  const credentials = { accessKeyId: settings.S3_ACCESS_KEY_ID, secretAccessKey: settings.S3_SECRET_ACCESS_KEY };
  const config = { endpointUrl: settings.S3_ENDPOINT_URL, region: settings.S3_REGION, bucket: settings.S3_BUCKET, forcePathStyle: false };
  const client = new S3Client({ endpoint: config.endpointUrl, region: config.region, credentials });
  const objects = [];
  let continuation: string | undefined;
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: config.bucket, ContinuationToken: continuation }));
    objects.push(...(page.Contents ?? []).filter(item => item.Key && !item.Key.endsWith('/')));
    continuation = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuation);
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const project = await db.query('select name from bot_projects where id=$1', [projectId]);
    if (!project.rowCount) throw new Error('Локальный проект не найден');
    await db.query('begin');
    await db.query(`insert into storage_configs (id,name,backend,is_active,read_only,config,secrets_enc)
      values ($1,$2,'s3',false,true,$3,$4) on conflict (id) do update set config=excluded.config,secrets_enc=excluded.secrets_enc,read_only=true,is_active=false`,
      [STORAGE_ID, 'Railway S3 · просмотр', JSON.stringify(config), encryptCredentials(credentials)]);
    for (const item of objects) {
      const key = item.Key!;
      const name = key.split('/').pop()!;
      const mime = lookup(name) || 'application/octet-stream';
      const type = mime.startsWith('image/') ? 'photo' : mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : 'document';
      const url = `/api/media/s3-proxy/${STORAGE_ID}/${key.split('/').map(encodeURIComponent).join('/')}`;
      await db.query(`insert into media_files (project_id,file_name,file_type,file_path,file_size,mime_type,url,description,storage_backend,storage_config_id,created_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,'s3',$9,$10) on conflict (url,project_id) do nothing`,
        [projectId,name,type,key,item.Size ?? 0,mime,url,'Предпросмотр Railway S3: объект доступен только для чтения',STORAGE_ID,item.LastModified ?? new Date()]);
    }
    await db.query('commit');
    console.log(JSON.stringify({ project: project.rows[0].name, projectId, objects: objects.length, storage: STORAGE_ID, readOnly: true }));
  } catch (error) { await db.query('rollback'); throw error; }
  finally { await db.end(); client.destroy(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
