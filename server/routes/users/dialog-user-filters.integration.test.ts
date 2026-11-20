/** @fileoverview Реальная фильтрация личных диалогов до пагинации в отдельной схеме PostgreSQL. */
import {beforeAll,afterAll,it,expect} from 'vitest';
import {createAnalyticsTestDatabase} from '../analytics/v2/test-database';
import {dialogActivityConditions,dialogProfileFacetSelection} from '../dialogs/dialog-user-filters';
import {advancedUserWhere} from './user-advanced-filter-sql';
import {userSourceSql} from './user-directory-sql';
import {userStatusPredicate} from './user-status-filter';
import {userSourceCountsSql,userPremiumCountsSql} from './user-facet-counts';
import {userStatusCountsSql} from './user-status-counts';
const database=createAnalyticsTestDatabase();
beforeAll(async()=>{
  await database.setup();
  await database.pool.query(`ALTER TABLE bot_users ADD COLUMN imported_at timestamptz,ADD COLUMN deep_link_param text,
    ADD COLUMN referrer_id text,ADD COLUMN user_data jsonb DEFAULT '{}',ADD COLUMN is_active integer DEFAULT 1;
    ALTER TABLE bot_tokens ADD COLUMN authorization_error text;
    INSERT INTO bot_users(project_id,token_id,user_id,is_premium,is_blocked,language_code,deep_link_param,user_data,last_interaction) VALUES
    (1,11,101,1,0,'ru','alpha','{"tier":"gold"}','2099-01-01'),
    (1,11,102,0,1,'ru','beta','{"tier":"silver"}','2099-01-01'),
    (1,11,103,1,0,'en','alpha','{"tier":"gold"}','2099-01-01'),
    (1,11,104,1,0,'ru','alpha','{"tier":"gold"}','2099-01-01'),
    (1,12,105,1,0,'ru','alpha','{"tier":"gold"}','2099-01-01'),
    (2,21,201,1,0,'ru','alpha','{"tier":"gold"}','2099-01-01');
    INSERT INTO bot_messages(project_id,token_id,user_id,chat_type,message_type,message_text,created_at) VALUES
    (1,11,'101','private','user','needle','2026-11-01T12:00Z'),
    (1,11,'101','private','bot','reply','2026-11-01T13:00Z'),
    (1,11,'102','private','user','needle','2026-11-02T12:00Z'),
    (1,11,'103','private','user','needle','2026-11-03T12:00Z'),
    (1,11,'104','supergroup','user','needle','2026-11-03T12:00Z'),
    (1,12,'105','private','user','needle','2026-11-03T12:00Z'),
    (2,21,'201','private','user','needle','2026-11-03T12:00Z');`);
});
afterAll(()=>database.cleanup());
/** Базовая форма личных диалогов сохраняет историю и независимую область бота. */
const base=`SELECT u.user_id::text "userId",u.is_premium=1 "isPremium",u.is_deleted=1 "isDeleted",
  u.is_blocked=1 "isBlocked",u.is_active=1 "isActive",u.language_code "languageCode"
  FROM bot_users u JOIN LATERAL(SELECT m.created_at FROM bot_messages m
    WHERE m.project_id=u.project_id AND m.token_id=u.token_id AND m.user_id=u.user_id::text AND m.chat_type='private'
    ORDER BY m.created_at DESC LIMIT 1) lm ON true
  WHERE u.project_id=$1 AND ($2::integer IS NULL OR u.token_id=$2) AND u.is_bot=0`;
it('совмещает источник, Premium, статус и переменные до LIMIT, не подмешивая группы и чужую область',async()=>{
  const params:unknown[]=[1,11];
  const filters=advancedUserWhere({language:'ru',variableName:'tier',variableMode:'equals',variableValue:'gold'},params);
  params.push('Ссылка · alpha');
  const selection=`${base} AND ${filters.join(' AND ')} AND ${userSourceSql}=$${params.length} AND u.is_premium=1 AND (${userStatusPredicate('active')})`;
  const rows=await database.pool.query(`${selection} ORDER BY lm.created_at DESC LIMIT 1`,params);
  expect(rows.rows.map(row=>row.userId)).toEqual(['101']);
  const total=await database.pool.query(`SELECT COUNT(*)::integer total FROM (${selection}) matched`,params);
  expect(total.rows[0].total).toBe(1);
});
it('фильтрует дату по сообщению и сохраняет поиск по истории без дублей',async()=>{
  const params:unknown[]=[1,11];
  const conditions=dialogActivityConditions(advancedUserWhere({lastActiveFrom:'2026-11-02',lastActiveTo:'2026-11-03'},params));
  params.push('%needle%');
  const selection=`${base} AND ${conditions.join(' AND ')} AND EXISTS(SELECT 1 FROM bot_messages bm
    WHERE bm.project_id=u.project_id AND bm.token_id=u.token_id AND bm.user_id=u.user_id::text
      AND bm.chat_type='private' AND bm.message_text ILIKE $${params.length})`;
  const first=await database.pool.query(`${selection} ORDER BY lm.created_at DESC LIMIT 1`,params);
  const second=await database.pool.query(`${selection} ORDER BY lm.created_at DESC LIMIT 1 OFFSET 1`,params);
  expect(first.rows[0].userId).toBe('103');expect(second.rows[0].userId).toBe('102');
});
it('вычисляет фасеты только по существующим личным диалогам той же области',async()=>{
  const selection=dialogProfileFacetSelection(base);
  const sources=await database.pool.query(userSourceCountsSql(selection),[1,11]);
  expect(sources.rows).toEqual([{source:'Ссылка · alpha',count:2},{source:'Ссылка · beta',count:1}]);
  const premium=await database.pool.query(userPremiumCountsSql(selection),[1,11]);
  expect(premium.rows[0]).toEqual({all:3,true:2,false:1});
  const statuses=await database.pool.query(userStatusCountsSql(selection,true),[1,11]);
  expect(statuses.rows[0]).toMatchObject({all:3,active:2,blocked:1});
});
