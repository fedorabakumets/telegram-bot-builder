/**
 * @fileoverview Создаёт приватный бакет версий в локальном Silo и его конфигурацию.
 */
import 'dotenv/config';
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { pool } from '../server/database/db';
import { decryptCredentials } from '../server/storage/storage-secrets';

/**
 * Создаёт бакет и запись конфигурации без вывода учётных данных.
 * @returns Завершение настройки
 */
async function main(): Promise<void> {
  const sourceId = 'silo-bot-builds-local';
  const targetId = 'silo-project-versions-local';
  const bucket = 'tbb-project-versions-local';
  const result = await pool.query<{ config: { endpointUrl: string; region: string; forcePathStyle: boolean }; secrets_enc: string }>(
    'SELECT config, secrets_enc FROM storage_configs WHERE id = $1 AND backend = $2', [sourceId, 's3']);
  const source = result.rows[0];
  if (!source?.secrets_enc) throw new Error('Локальная конфигурация Silo не найдена');
  const credentials = decryptCredentials(source.secrets_enc);
  const client = new S3Client({ endpoint: source.config.endpointUrl, region: source.config.region,
    forcePathStyle: source.config.forcePathStyle, credentials });
  try { await client.send(new HeadBucketCommand({ Bucket: bucket })); }
  catch { await client.send(new CreateBucketCommand({ Bucket: bucket })); }
  const config = { ...source.config, bucket, publicUrlBase: undefined };
  await pool.query(`INSERT INTO storage_configs(id, name, backend, is_active, read_only, config, secrets_enc)
    VALUES($1, $2, 's3', false, false, $3, $4)
    ON CONFLICT(id) DO UPDATE SET config = EXCLUDED.config, secrets_enc = EXCLUDED.secrets_enc,
    read_only = false`, [targetId, 'Silo: версии проектов', JSON.stringify(config), source.secrets_enc]);
  console.log(`Настроено приватное хранилище версий: ${targetId}`);
  await client.destroy();
}

main().catch(error => { console.error('Не удалось настроить Silo:', error.message); process.exitCode = 1; })
  .finally(() => pool.end());
