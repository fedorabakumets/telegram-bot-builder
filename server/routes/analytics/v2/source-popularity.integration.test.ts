/** @fileoverview Сортировка источников использует всю аудиторию до пагинации, а не алфавит. */
import {beforeAll,afterAll,it,expect} from 'vitest';
import {createAnalyticsTestDatabase} from './test-database';
import {userSourceSql,userSourcePopularitySql} from '../../users/user-directory-sql';
const database=createAnalyticsTestDatabase();
beforeAll(()=>database.setup());
afterAll(()=>database.cleanup());
/** Полный набор содержит три крупных, два средних и один редкий источник. */
const selection = `SELECT u.user_id,${userSourceSql} source,${userSourcePopularitySql} popularity FROM
  (VALUES ('1','Z'),('2','Z'),('3','Z'),('4','A'),('5','B'),('6','B')) v(user_id,deep_link_param)
  CROSS JOIN LATERAL (SELECT v.*,NULL::text referrer_id) u`;
it('сначала показывает крупные источники, сохраняя их количество на второй странице',async()=>{
  const first=await database.pool.query(`${selection} ORDER BY popularity DESC,source,user_id LIMIT 2`,[1,11]);
  expect(first.rows.map(row=>[row.source,Number(row.popularity)])).toEqual([['Ссылка · Z',3],['Ссылка · Z',3]]);
  const next=await database.pool.query(`${selection} ORDER BY popularity DESC,source,user_id LIMIT 2 OFFSET 2`,[1,11]);
  expect(next.rows.map(row=>[row.source,Number(row.popularity)])).toEqual([['Ссылка · Z',3],['Ссылка · B',2]]);
});
it('обратное направление начинает с редкого источника и пересчитывается после фильтрации',async()=>{
  const small=await database.pool.query(`${selection} ORDER BY popularity ASC,source,user_id LIMIT 1`,[1,11]);
  expect(small.rows[0].source).toBe('Ссылка · A');
  const filtered=await database.pool.query(`${selection} WHERE u.user_id IN ('1','4','5','6') ORDER BY popularity DESC,source,user_id LIMIT 1`,[1,11]);
  expect(filtered.rows[0].source).toBe('Ссылка · B');
});
