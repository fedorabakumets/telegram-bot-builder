/**
 * @fileoverview Изолированная локальная копия Railway из свежего дампа для просмотра проектов и медиа.
 * Продакшен читается через pg_dump; локальная исходная БД не изменяется.
 */
import 'dotenv/config';
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { runPgRestore } from '../server/database/backups/pgDumpRestore';
import { encryptCredentials } from '../server/storage/storage-secrets';

/**
 * Создаёт новую БД, восстанавливает дамп и отключает внешние действия в локальной копии.
 * @returns Завершение настройки локальной копии
 */
async function main(): Promise<void> {
  const s3 = JSON.parse((await readFile(join(tmpdir(), 'tbb-local-s3-connect.json'), 'utf8')).replace(/^\uFEFF/, ''));
  const localUrl = new URL(process.env.DATABASE_URL!);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(localUrl.hostname)) throw new Error('Нужна локальная исходная БД');
  const name = `tbb_railway_preview_${Date.now()}`;
  const original = new Client({ connectionString: localUrl.toString() });
  await original.connect();
  const localUsers = (await original.query('select * from telegram_users')).rows;
  const sessions = (await original.query('select * from session')).rows;
  await original.query(`create database "${name}"`);
  await original.end();
  const dump = await readFile(join(tmpdir(), 'tbb-railway-preview.dump'));
  console.log('Дамп прочитан, байт:', dump.length);
  localUrl.pathname = `/${name}`;
  const target = localUrl.toString();
  const db = new Client({ connectionString: target });
  await db.connect();
  const major = Math.floor(Number((await db.query('show server_version_num')).rows[0].server_version_num) / 10000);
  await db.end();
  await runPgRestore(target, dump, { clean: false, targetMajor: major });
  const clone = new Client({ connectionString: target });
  await clone.connect();
  try {
    console.log('Восстановлено:', (await clone.query('select (select count(*) from bot_projects) projects,(select count(*) from media_files) media')).rows[0]);
    await clone.query('begin');
    await clone.query("update bot_instances set status='stopped',stopped_at=now(),error_message=null,process_id=null,token='local-preview'");
    await clone.query("update bot_tokens set token='local-preview-disabled-'||id,is_active=0,userbot_enabled=0,userbot_session_string=null");
    await clone.query('update bot_projects set bot_token=null');
    await clone.query("delete from app_settings where key like 'runtime.%'");
    await clone.query("insert into app_settings(key,value) values ('auth_login_mode','dev_login'),('runtime.UPLOADS_STORAGE_ID','s3-default'),('runtime.STORAGE_BACKEND','local'),('runtime.DB_BACKUP_INTERVAL_HOURS','0') on conflict(key) do update set value=excluded.value");
    await clone.query('update storage_configs set is_active=false,read_only=true');
    await clone.query("update storage_configs set is_active=true,read_only=false where id='local-default'");
    const config = { endpointUrl:s3.S3_ENDPOINT_URL,region:s3.S3_REGION,bucket:s3.S3_BUCKET,forcePathStyle:false };
    const secret = encryptCredentials({accessKeyId:s3.S3_ACCESS_KEY_ID,secretAccessKey:s3.S3_SECRET_ACCESS_KEY});
    await clone.query("update storage_configs set config=$1,secrets_enc=$2,read_only=true where id='s3-default'",[JSON.stringify(config),secret]);
    for (const user of localUsers) {
      await clone.query('insert into telegram_users select * from json_populate_record(null::telegram_users,$1::json) on conflict(id) do nothing',[JSON.stringify(user)]);
    }
    for (const session of sessions) {
      await clone.query('insert into session select * from json_populate_record(null::session,$1::json) on conflict(sid) do update set sess=excluded.sess,expire=excluded.expire',[JSON.stringify(session)]);
    }
    await clone.query('commit');
    console.log('Проекты с файлами:',(await clone.query('select p.id,p.name,count(m.id) files from bot_projects p join media_files m on m.project_id=p.id group by p.id,p.name order by files desc limit 8')).rows);
  } catch (error) { await clone.query('rollback'); throw error; }
  finally { await clone.end(); }
  const envFile = await readFile('.env','utf8');
  await copyFile('.env',join(tmpdir(),'tbb-env-before-railway-preview.private'));
  const next = envFile.replace(/^DATABASE_URL=.*$/m,`DATABASE_URL=${target}`).replace(/^PGDATABASE=.*$/m,`PGDATABASE=${name}`);
  await writeFile('.env',next);
  console.log('Локальная копия готова:',name,'; исходная БД сохранена');
}
main().catch(error=>{ console.error(error.message);process.exitCode=1; });
