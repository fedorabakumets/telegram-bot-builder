/** @fileoverview Бюджет простой ссылки сохраняется атомарно и повторно использует зарегистрированную метку. */
import { beforeAll,afterAll,expect,it } from 'vitest';
import { createAnalyticsTestDatabase } from '../v2/test-database';
import { saveLinkBudget } from './link-budget';
import { acquisitionReport } from './report';
const database=createAnalyticsTestDatabase();
beforeAll(()=>database.setup());afterAll(()=>database.cleanup());
it('сохраняет бюджет и повторно использует источник и ссылку без дублирования',async()=>{
  const client=await database.pool.connect();
  const body={tokenId:11,marker:'campaign_new',amount:'3000.00',currency:'RUB',day:'2026-11-02',timezone:'Europe/Moscow'};
  try {
    await client.query('BEGIN');
    await saveLinkBudget(client,1,body,null);
    await saveLinkBudget(client,1,{...body,amount:'20.00',currency:'USD'},null);
    const {rows:[counts]}=await client.query(`SELECT (SELECT count(*)::int FROM analytics_sources) sources,(SELECT count(*)::int FROM analytics_links) links,(SELECT count(*)::int FROM analytics_expenses) expenses`);
    expect(counts).toEqual({sources:1,links:1,expenses:2});
    expect((await client.query('SELECT code FROM analytics_links')).rows[0].code).toBe('campaign_new');
    await client.query('ROLLBACK');
    await client.query('BEGIN');
    await expect(saveLinkBudget(client,1,{...body,tokenId:21},null)).rejects.toThrow('Бот не принадлежит проекту');
    await client.query('ROLLBACK');
    expect((await client.query('SELECT count(*)::int count FROM analytics_expenses')).rows[0].count).toBe(0);
    await expect(saveLinkBudget(client,1,{...body,marker:'link_secret'},null)).rejects.toThrow();
  }finally{await client.query('ROLLBACK');client.release();}
});
it('отсекает переходы до начала бюджета и сохраняет существующую историческую привязку',async()=>{
  const client=await database.pool.connect();
  try {
    await client.query('BEGIN');
    await saveLinkBudget(client,1,{tokenId:11,marker:'dated_budget',amount:'30.00',currency:'RUB',day:'2026-10-20',timezone:'Europe/Moscow'},null);
    await client.query(`SELECT record_analytics_event_v2('{
      "project_id":1,"token_id":11,"event_key":"msg:300:1","kind":"message_in","user_id":"300","chat_id":"300",
      "chat_type":"private","directed":true,"occurred_at":"2026-10-19T12:00:00Z","provenance":"backfill"}'::jsonb);
      INSERT INTO analytics_start_observations_v2(project_id,token_id,user_id,legacy_message_id,event_key,observed_at,marker,category) VALUES
      (1,11,'300',1,'msg:300:1','2026-10-19T12:00:00Z','dated_budget','marker'),
      (1,11,'300',2,'msg:300:2','2026-10-21T12:00:00Z','dated_budget','marker')`);
    /** Запоздавшие современные события с той же меткой также не относятся к будущему бюджету. */
    await client.query(`SELECT record_analytics_event_v2(jsonb_build_object('project_id',1,'token_id',11,
      'event_key','msg:'||person||':early','kind','message_in','user_id',person,'chat_id',person,'chat_type','private',
      'directed',true,'occurred_at','2026-10-19T13:00:00Z','source_id',l.source_id,'placement_id',l.placement_id,
      'attribution_status','resolved','metadata',jsonb_build_object('entry',true)))
      FROM analytics_links l CROSS JOIN unnest(ARRAY['300','301']) person WHERE l.code='dated_budget'`);
    const report=await acquisitionReport(client,1,{tokenId:11,from:'2026-10-18T21:00:00Z',to:'2026-10-22T21:00:00Z'});
    expect(report.rows[0]).toMatchObject({newUsers:0,historicalUsers:0,returningUsers:0,repeatStarts:1});
    /** Ранний современный запуск не подавляет действительный исторический возврат после начала бюджета. */
    const later=await acquisitionReport(client,1,{tokenId:11,from:'2026-10-19T12:30:00Z',to:'2026-10-22T21:00:00Z'});
    expect(later.rows[0]).toMatchObject({newUsers:0,historicalUsers:0,returningUsers:1,repeatStarts:1});
    /** Повторная оплата не переписывает дату начала и признак демонстрационных исторических связей. */
    await client.query('UPDATE analytics_placement_history_v2 SET is_demo=true WHERE project_id=1');
    const before=(await client.query('SELECT * FROM analytics_placement_history_v2')).rows;
    await saveLinkBudget(client,1,{tokenId:11,marker:'dated_budget',amount:'50.00',currency:'RUB',day:'2026-11-02',timezone:'UTC'},null);
    expect((await client.query('SELECT * FROM analytics_placement_history_v2')).rows).toEqual(before);
    const placement=(await client.query("SELECT starts_on::text,timezone FROM analytics_placements WHERE name='dated_budget'")).rows[0];
    expect(placement).toEqual({starts_on:'2026-10-20',timezone:'Europe/Moscow'});
  }finally{await client.query('ROLLBACK');client.release();}
});
it('отклоняет бюджет архивного источника и откатывает ошибку после создания связанных записей',async()=>{
  const client=await database.pool.connect();
  const body={tokenId:11,marker:'archive_test',amount:'30.00',currency:'RUB',day:'2026-11-02',timezone:'Europe/Moscow'};
  try {
    await client.query('BEGIN');
    await saveLinkBudget(client,1,body,null);
    await client.query('UPDATE analytics_sources SET archived_at=now() WHERE project_id=1');
    await expect(saveLinkBudget(client,1,body,null)).rejects.toThrow('Источник находится в архиве');
    expect((await client.query('SELECT count(*)::int count FROM analytics_expenses')).rows[0].count).toBe(1);
    await client.query('ROLLBACK');
    /** Ограничение имитирует сбой последней операции без вмешательства в данные приложения. */
    await client.query('BEGIN');
    await client.query('ALTER TABLE analytics_expenses ADD CONSTRAINT test_budget_failure CHECK (amount < 10)');
    await expect(saveLinkBudget(client,1,body,null)).rejects.toThrow();
    await client.query('ROLLBACK');
    const {rows:[counts]}=await client.query(`SELECT (SELECT count(*)::int FROM analytics_sources) sources,
      (SELECT count(*)::int FROM analytics_links) links,(SELECT count(*)::int FROM analytics_placements) placements,
      (SELECT count(*)::int FROM analytics_acquisition_audit) audit,(SELECT count(*)::int FROM analytics_expenses) expenses`);
    expect(counts).toEqual({sources:0,links:0,placements:0,audit:0,expenses:0});
    await expect(saveLinkBudget(client,1,{...body,unexpected:true},null)).rejects.toThrow();
  }finally{await client.query('ROLLBACK');client.release();}
});

it('сохраняет курс, примечание и подтверждённое распределение нового источника',async()=>{
  const client=await database.pool.connect();
  try {
    await client.query('BEGIN');
    await saveLinkBudget(client,1,{tokenId:11,marker:'future_allocated',amount:'100.00',currency:'USD',day:'2026-11-02',untilDay:'2026-11-04',allocation:'equal',timezone:'Europe/Moscow',exchangeRateRubPerUsd:'80.5',exchangeRateDate:'2026-11-01',note:'Тест'},null);
    const {rows}=await client.query("SELECT amount::text,exchange_rate_rub_per_usd::text rate,note,estimated FROM analytics_expenses ORDER BY day");
    expect(rows.map(row=>Number(row.amount))).toEqual([33.33,33.33,33.34]);
    expect(rows.every(row=>Number(row.rate)===80.5 && row.note==='Тест' && row.estimated)).toBe(true);
  }finally{await client.query('ROLLBACK');client.release();}
});
