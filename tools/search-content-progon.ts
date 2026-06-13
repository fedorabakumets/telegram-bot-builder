/**
 * @fileoverview Поиск слова «прогон» в таблице _content проекта
 */
import { storage } from '../server/storages/storage';

const projectId = Number(process.argv[2] || 242);

async function main(): Promise<void> {
  const tables = await storage.getBotTables(projectId);
  const content = tables.find((t) => t.name === '_content');
  if (!content) {
    console.log(`NO _content for project ${projectId}`);
    return;
  }
  const [rows, cols] = await Promise.all([
    storage.getBotTableRows(content.id),
    storage.getBotTableColumns(content.id),
  ]);
  const colMap = Object.fromEntries(cols.map((c) => [c.name, String(c.id)]));
  const hits = rows.filter((r) => {
    const data = r.data as Record<string, string>;
    return Object.values(data).join(' ').toLowerCase().includes('прогон');
  });
  console.log(`project=${projectId} table=_content id=${content.id} rows=${rows.length} hits=${hits.length}`);
  for (const r of hits) {
    const d = r.data as Record<string, string>;
    const key = d[colMap.key] ?? '';
    const val = d[colMap.value] ?? '';
    console.log('---');
    console.log('key:', key);
    console.log('value:', val.slice(0, 500));
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
