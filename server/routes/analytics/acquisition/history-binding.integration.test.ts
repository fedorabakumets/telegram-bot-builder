/** @fileoverview Демо-расходы связываются с исторической меткой без подмены точного привлечения. */
import { beforeAll, afterAll, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from '../v2/test-database';
import { acquisitionReport } from './report';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup()); afterAll(() => database.cleanup());
it('показывает первые контакты и поздние входы отдельно от новых пользователей и CPA', async () => {
  await database.record({ user_id: '100', event_key: 'msg:100:1', provenance: 'backfill' });
  await database.pool.query(`INSERT INTO analytics_sources(id,project_id,name) VALUES(7,1,'Демо');
    INSERT INTO analytics_placements(id,project_id,token_id,source_id,name) VALUES(8,1,11,7,'Демо');
    INSERT INTO analytics_expenses(project_id,placement_id,amount,currency,day) VALUES(1,8,1000,'RUB','2026-10-20');
    INSERT INTO analytics_placement_history_v2(project_id,placement_id,token_id,marker,is_demo) VALUES(1,8,11,'old_ad',true);
    INSERT INTO analytics_start_observations_v2(project_id,token_id,user_id,legacy_message_id,event_key,observed_at,marker,category) VALUES
      (1,11,'100',1,'msg:100:1','2026-10-20T12:00:00.100Z','old_ad','marker'),
      (1,11,'100',2,'msg:100:2','2026-10-21T12:00:00Z','old_ad','marker')`);
  const client = await database.pool.connect();
  try {
    const report = await acquisitionReport(client,1,{tokenId:11,from:'2026-10-20T00:00:00+03:00',to:'2026-10-22T00:00:00+03:00'});
    expect(report.rows[0]).toMatchObject({newUsers:0,historicalUsers:1,returningUsers:0,repeatStarts:1,isDemo:true,costPerUser:null,demoCostPerContact:'1000.00'});
    /** Старый контакт становится вернувшимся, когда первое обращение находится до начала окна. */
    const later = await acquisitionReport(client,1,{tokenId:11,from:'2026-10-21T00:00:00+03:00',to:'2026-10-22T00:00:00+03:00'});
    expect(later.rows[0]).toMatchObject({historicalUsers:0,returningUsers:1,repeatStarts:1});
    /** Повторная запись той же физической команды новым писателем не удваивает старое наблюдение. */
    await database.record({user_id:'100',event_key:'msg:100:2',source_id:7,placement_id:8,
      attribution_status:'resolved',metadata:{entry:true},occurred_at:'2026-10-21T12:00:00Z'});
    const replayed=await acquisitionReport(client,1,{tokenId:11,from:'2026-10-21T00:00:00+03:00',to:'2026-10-22T00:00:00+03:00'});
    expect(replayed.rows[0]).toMatchObject({historicalUsers:0,returningUsers:1,repeatStarts:1});
    /** Несколько действительных запусков одного человека остаются одним вернувшимся. */
    await database.record({user_id:'100',event_key:'msg:100:3',source_id:7,placement_id:8,
      attribution_status:'resolved',metadata:{entry:true},occurred_at:'2026-10-21T13:00:00Z'});
    const repeated=await acquisitionReport(client,1,{tokenId:11,from:'2026-10-21T00:00:00+03:00',to:'2026-10-22T00:00:00+03:00'});
    expect(repeated.rows[0]).toMatchObject({returningUsers:1,repeatStarts:2});
    /** Неполный день запрещает цену, но не скрывает реально указанную дневную сумму. */
    const partial = await acquisitionReport(client,1,{tokenId:11,from:'2026-10-20T10:00:00+03:00',to:'2026-10-22T00:00:00+03:00'});
    expect(partial.rows[0]).toMatchObject({spend:{RUB:'1000.00'},costPerUser:null,demoCostPerContact:null});
    expect((await client.query('SELECT first_known,placement_id FROM analytics_audience_v2')).rows[0]).toMatchObject({first_known:false,placement_id:null});
  } finally {client.release();}
});
