/** @fileoverview Источники появляются без размещений, не дублируют связи и не раскрывают чужие проекты. */
import { beforeAll, afterAll, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from '../v2/test-database';
import { acquisitionReport } from './report';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup()); afterAll(() => database.cleanup());
it('добавляет найденные источники без расходов, включая неактивные в выбранном периоде', async () => {
  await database.record({ user_id:'100',event_key:'msg:100:1',provenance:'backfill',observed_tag:'free_ad',attribution_status:'unknown' });
  await database.record({ user_id:'101',event_key:'msg:101:1',provenance:'backfill',observed_tag:'paid_ad',attribution_status:'unknown' });
  await database.record({ user_id:'102',event_key:'msg:102:1',provenance:'backfill',observed_tag:'old_ad',attribution_status:'unknown',occurred_at:'2026-10-01T10:00:00Z' });
  await database.record({ project_id:2,token_id:21,user_id:'200',event_key:'msg:200:1',observed_tag:'foreign',attribution_status:'unknown' });
  await database.pool.query(`INSERT INTO analytics_sources(id,project_id,name) VALUES(7,1,'Оплаченный'),(9,2,'Чужой источник');
    INSERT INTO analytics_placements(id,project_id,token_id,source_id,name) VALUES(8,1,11,7,'Размещение');
    INSERT INTO analytics_placement_history_v2(project_id,placement_id,token_id,marker) VALUES(1,8,11,'paid_ad')`);
  const client = await database.pool.connect();
  try {
    const query={tokenId:11,from:'2026-10-20T00:00:00Z',to:'2026-10-23T00:00:00Z'};
    expect((await acquisitionReport(client,1,query)).rows).toHaveLength(1);
    const report=await acquisitionReport(client,1,{...query,includeSources:'true'});
    expect(report.rows).toHaveLength(3);
    expect(report.rows.find(r=>r.name==='free_ad')).toMatchObject({placementId:null,historicalUsers:1,spend:{RUB:null,USD:null},reason:'Расход не указан'});
    expect(report.rows.find(r=>r.name==='old_ad')).toMatchObject({placementId:null,historicalUsers:0});
    expect(report.rows.filter(r=>r.name==='paid_ad')).toHaveLength(0);
    expect(JSON.stringify(report.rows)).not.toMatch(/foreign|Чужой источник/);
    expect((await client.query('SELECT count(*)::int count FROM analytics_placements WHERE project_id=1')).rows[0].count).toBe(1);
  } finally {client.release();}
});
