/** @fileoverview Проверки общих правил профильных фильтров личных диалогов без запуска сервера. */
import {describe,it,expect} from 'vitest';
import {hasDialogProfileConstraints,dialogActivityConditions,dialogProfileFacetSelection} from '../dialogs/dialog-user-filters';
import {advancedUserWhere} from './user-advanced-filter-sql';

describe('Профильные фильтры диалогов',()=>{
  it('не считает пустые настройки ограничением вкладки «Все»',()=>{
    for(const query of [{},{source:'',status:'all',premium:'all'},{filters:'{}'},{filters:JSON.stringify({variableName:'',language:null})}])
      expect(hasDialogProfileConstraints(query)).toBe(false);
  });
  it('распознаёт источник, статус, обе опции Premium и дополнительные ограничения',()=>{
    for(const query of [{source:'Ссылка · A'},{status:'blocked'},{premium:'true'},{premium:'false'},
      {filters:JSON.stringify({language:'ru'})},{filters:JSON.stringify({messagesMax:'0'})},
      {filters:JSON.stringify({variableName:'tier',variableMode:'filled'})}]) expect(hasDialogProfileConstraints(query)).toBe(true);
  });
  it('не пропускает некорректный фильтр как отсутствие ограничения',()=>{
    for(const filters of ['{broken','null','7']) expect(hasDialogProfileConstraints({filters})).toBe(true);
  });
  it('использует дату последнего сообщения вместо обновления профиля, сохраняя параметры',()=>{
    const params:unknown[]=[1,11];
    const original=advancedUserWhere({lastActiveFrom:'2026-11-01',lastActiveTo:'2026-11-03',variableName:'tier',variableMode:'equals',variableValue:'gold'},params);
    const adapted=dialogActivityConditions(original);
    expect(adapted.join(' ')).toContain('lm.created_at');
    expect(adapted.join(' ')).not.toContain('u.last_interaction');
    expect(original.join(' ')).toContain('u.last_interaction');
    expect(params).toEqual([1,11,'2026-11-01','2026-11-03','tier','gold']);
  });
  it('добавляет метаданные только в личную выборку фасетов, не меняя базовую форму',()=>{
    const base=' SELECT u.user_id FROM bot_users u WHERE u.project_id=$1';
    const facets=dialogProfileFacetSelection(base);
    expect(base).not.toContain('botUnavailable');
    expect(facets).toContain('AS "acquisitionSource"');
    expect(facets).toContain('AS "botUnavailable"');
    expect(facets.endsWith('u.user_id FROM bot_users u WHERE u.project_id=$1')).toBe(true);
  });
});
