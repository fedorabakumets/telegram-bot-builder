/** @fileoverview Узкие проверки только временного проекта Glide. */
require('dotenv').config({quiet:true});
const fs=require('node:fs');const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL});
const f=JSON.parse(fs.readFileSync('output/table-ui-fixture.json','utf8'));
/** Читает результат или имитирует конфликт строго в тестовой таблице. */
async function main(){const t=f.tables[1];const ok=await p.query("SELECT id FROM bot_projects WHERE id=$1 AND name='QA таблицы временный проект'",[f.projectId]);if(!ok.rowCount)throw Error('Неверный проект');
if(process.argv[2]==='conflict')await p.query('UPDATE bot_table_rows SET data=jsonb_set(data,ARRAY[$1::text],to_jsonb($2::text)) WHERE table_id=$3 AND row_index=4',[String(t.columns[2].id),'2026-10-30',t.id]);
console.log(JSON.stringify((await p.query('SELECT row_index,data FROM bot_table_rows WHERE table_id=$1 AND row_index<=4 ORDER BY row_index',[t.id])).rows));}
main().finally(()=>p.end());
