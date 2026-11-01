/** @fileoverview Узкая проверка уточнения размеров старых фото в локальной копии Railway. */
import 'dotenv/config';
import type { Request, Response } from 'express';
import { getMessageFileSize } from '../server/routes/botIntegration/handlers/botData/get-message-file-size';
import { pool } from '../server/database/db';
/** Вызывает обработчик без запуска сервера, не меняя содержимое медиа. */
async function read(project: number, id: number) {
 let status=200; let body: {fileSize?:number;message?:string}={};
 const response={status:(code:number)=>{status=code;return response},json:(value:typeof body)=>{body=value;return response}};
 await getMessageFileSize({params:{projectId:String(project),messageId:String(id)}} as unknown as Request,response as unknown as Response);
 return {status,body};
}
/** Проверяет размер Telegram, сохранение и изоляцию проекта на локальной базе. */
async function main(){
 if(!/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL??''))throw new Error('Разрешена только локальная БД');
 const wrong=await read(9,136215);if(wrong.status!==404)throw new Error('Нет изоляции проекта');
 for(const id of [136215,136213]){
   const result=await read(12,id);
   if(result.status!==200||!result.body.fileSize)throw new Error(`Размер не получен: ${id}, статус ${result.status}`);
   const {rows}=await pool.query("select (message_data->'photo'->>'file_size')::bigint as size from bot_messages where id=$1",[id]);
   if(Number(rows[0].size)!==result.body.fileSize)throw new Error('Размер не сохранён');
   const repeated=await read(12,id);if(repeated.body.fileSize!==result.body.fileSize)throw new Error('Повторное чтение отличается');
   console.log('OK',id,result.body.fileSize,'байт; сохранено и повторно прочитано');
 }
 await pool.end(); process.exit(0);
}
main().catch(async error=>{console.error(error.message);await pool.end();process.exit(1)});
