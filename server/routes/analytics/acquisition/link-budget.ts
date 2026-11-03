/** @fileoverview Атомарное сохранение бюджета для простой start-метки. */
import type { PoolClient } from 'pg';
import { AcquisitionError } from './validation';
import { acquisitionBot, createAcquisition } from './create';
import { createExpenses } from './expenses';
import { acquisitionDto, recordAcquisitionChange, scopedRow } from './storage';
import { findStartConflict } from './link-routing';
/** Общий контракт доступен старым импортам без изменения поведения. */
import { linkBudgetInput } from '../../../../shared/analytics/acquisition/link-budget';
export { linkBudgetInput };
/** Сохраняет связанные сущности в транзакции маршрута; повторная оплата использует ту же метку. */
export async function saveLinkBudget(client:PoolClient,project:number,body:unknown,actor:string|null) {
  const input=linkBudgetInput.parse(body);
  await acquisitionBot(client,project,input.tokenId);
  const existing=await client.query('SELECT * FROM analytics_links WHERE project_id=$1 AND token_id=$2 AND code=$3',[project,input.tokenId,input.marker]);
  let link=existing.rows[0];
  if(link?.archived_at || link && link.purpose!=='acquisition') throw new AcquisitionError('Метка уже используется другой ссылкой',409);
  if(!link) {
    const {rows:[owner]}=await client.query('SELECT data FROM bot_projects WHERE id=$1',[project]);
    if(findStartConflict(owner?.data,input.marker)) throw new AcquisitionError('Метка используется маршрутом сценария. Выберите другую метку',409);
    const bound=await client.query('SELECT p.* FROM analytics_placement_history_v2 h JOIN analytics_placements p ON p.project_id=h.project_id AND p.id=h.placement_id WHERE h.project_id=$1 AND h.token_id=$2 AND h.marker=$3',[project,input.tokenId,input.marker]);
    if(bound.rows[0]?.archived_at) throw new AcquisitionError('Размещение этой метки находится в архиве');
    const found=await client.query('SELECT * FROM analytics_sources WHERE project_id=$1 AND name=$2 AND archived_at IS NULL ORDER BY id LIMIT 1',[project,input.marker]);
    const source=bound.rowCount ? {id:bound.rows[0].source_id} : found.rows[0] ?? await createAcquisition(client,project,'sources',{name:input.marker});
    if(!bound.rowCount && !found.rowCount) await recordAcquisitionChange(client,project,'sources',source,actor);
    const placement=bound.rows[0] ?? await createAcquisition(client,project,'placements',{sourceId:source.id,tokenId:input.tokenId,name:input.marker,startsOn:input.day,timezone:input.timezone});
    if(!bound.rowCount) await recordAcquisitionChange(client,project,'placements',placement,actor);
    const created=await client.query(`INSERT INTO analytics_links(project_id,token_id,source_id,placement_id,code,purpose) VALUES($1,$2,$3,$4,$5,'acquisition') RETURNING *`,[project,input.tokenId,source.id,placement.id,input.marker]);
    link=created.rows[0];
    await recordAcquisitionChange(client,project,'links',link,actor);
    await client.query('INSERT INTO analytics_placement_history_v2(project_id,placement_id,token_id,marker) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[project,placement.id,input.tokenId,input.marker]);
  }
  /** Повторный бюджет не возобновляет архивный источник через ранее созданную ссылку. */
  const source=await scopedRow(client,'sources',project,link.source_id);
  if(source.archived_at) throw new AcquisitionError('Источник находится в архиве');
  const expenses=await createExpenses(client,project,{placementId:link.placement_id,amount:input.amount,currency:input.currency,day:input.day,exchangeRateRubPerUsd:input.exchangeRateRubPerUsd,exchangeRateDate:input.exchangeRateDate,note:input.note,untilDay:input.untilDay,allocation:input.allocation});
  for(const expense of expenses) await recordAcquisitionChange(client,project,'expenses',expense,actor);
  return {item:acquisitionDto(expenses[0])};
}
