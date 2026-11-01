/** @fileoverview Проверка реальных связей медиа с блоками в локальном дампе. */
import 'dotenv/config';
import { Client } from 'pg';
import { findFileUsages } from '../client/components/editor/files/hooks/use-file-node-usages';
/** Сверяет URL медиа с листами каждого проекта без изменения данных. */
async function main(){
 const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
 const projects=(await db.query('select id,name,data from bot_projects')).rows;
 const media=(await db.query('select id,project_id,file_name,url from media_files')).rows;
 let count=0; const examples=[];
 for(const file of media){const project=projects.find(p=>p.id===file.project_id); const usages=findFileUsages(file.url,project?.data?.sheets??[]); if(usages.length){count++;if(examples.length<4)examples.push({project:project.name,fileId:file.id,file:file.file_name,blocks:usages.length});}}
 console.log(JSON.stringify({files:media.length,withUsages:count,examples}));await db.end();
}main().catch(e=>{console.error(e.message);process.exitCode=1});
