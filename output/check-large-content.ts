/** @fileoverview Проверка сохранения контента после тысячной записи на отдельном временном проекте. */
import 'dotenv/config';
import assert from 'node:assert/strict';
/** Проверяет реальную синхронизацию с базой и очищает только собственный тестовый проект. */
async function main() {
  const originalLog = console.log; console.log = () => {};
  const { syncContentToTable } = await import('../server/services/content-table/sync-content-to-table');
  const { pool } = await import('../server/database/db');
  const { dbManager } = await import('../server/database/db-utils');
  console.log = originalLog;
  let projectId = 0;
  try {
    const data = { sheets: [{ id: 'large', name: 'Большой лист', nodes: Array.from({ length: 1107 }, (_, index) => ({ id: `message_${index}`, type: 'message', data: { messageText: `Сообщение ${index}` } })) }] };
    projectId = (await pool.query("INSERT INTO bot_projects(name,data) VALUES ('QA проверка большого контента',$1::jsonb) RETURNING id", [JSON.stringify(data)])).rows[0].id;
    await syncContentToTable(projectId, data);
    const count = Number((await pool.query('SELECT count(*) FROM bot_table_rows r JOIN bot_tables t ON t.id=r.table_id WHERE t.project_id=$1',[projectId])).rows[0].count);
    assert.equal(count,1107);
    const last = await pool.query("SELECT r.id FROM bot_table_rows r JOIN bot_tables t ON t.id=r.table_id WHERE t.project_id=$1 AND r.data::text LIKE '%message_1106%'",[projectId]);
    assert.equal(last.rows.length,1);
    console.log(JSON.stringify({test:'Контент после тысячной записи',rows:count,lastRecordFound:true}));
  } finally {
    if (projectId) await pool.query("DELETE FROM bot_projects WHERE id=$1 AND name='QA проверка большого контента'",[projectId]);
    dbManager.stopHealthMonitoring(); await pool.end();
  }
}
main().then(()=>process.exit(0)).catch(error=>{console.error(error);process.exit(1);});
