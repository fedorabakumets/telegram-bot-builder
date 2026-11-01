/** @fileoverview Узкая проверка контекста сообщения на локальном дампе без изменения данных. */
import 'dotenv/config';
import { getMessageContext } from '../server/routes/botIntegration/handlers/messages/get-message-context';
import { pool } from '../server/database/db';
/** Проверяет попадание цели и изоляцию другого проекта. */
async function main(){
 if(!/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL??''))throw new Error('Только локальная БД');
 const rows=await getMessageContext(12,9,'777000',136810);
 if(!rows?.some(row=>row.id===136810)||rows.length>51)throw new Error('Неверный контекст');
 if(await getMessageContext(9,9,'777000',136810))throw new Error('Нарушена изоляция проекта');
 if(await getMessageContext(12,9,'123',136810))throw new Error('Нарушена изоляция чата');
 const group=await getMessageContext(12,9,'-1002581530924',136810,true);
 if(!group?.some(row=>row.id===136810))throw new Error('Нет группового сообщения');
 if(await getMessageContext(12,9,'-100123',136810,true))throw new Error('Нарушена изоляция группы');
 console.log('Context OK, messages:',rows.length);await pool.end();
}main().catch(async e=>{console.error(e.message);await pool.end();process.exitCode=1});
