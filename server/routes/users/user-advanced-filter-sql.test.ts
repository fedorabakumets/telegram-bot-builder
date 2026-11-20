/** @fileoverview Проверка валидации диапазонов и безопасного SQL дополнительных фильтров. */
import { describe, expect, it } from 'vitest';
import { advancedUserFiltersSchema } from '../../../shared/user-advanced-filters';
import { advancedUserWhere, userLanguageCondition } from './user-advanced-filter-sql';
describe('Дополнительные фильтры аудитории', () => {
  it('ограничивает дату последней активности включительно и отклоняет обратный диапазон', () => {
    const params: unknown[] = [12, 16];
    const filters = advancedUserFiltersSchema.parse({ lastActiveFrom: '2026-11-07', lastActiveTo: '2026-11-07' });
    const sql = advancedUserWhere(filters, params).join(' AND ');
    expect(sql).toContain('u.last_interaction>='); expect(sql).toContain('u.last_interaction<');
    expect(sql).toContain('::date+1'); expect(sql).toContain('Europe/Moscow');
    expect(params).toEqual([12, 16, '2026-11-07', '2026-11-07']);
    expect(advancedUserFiltersSchema.safeParse({ lastActiveFrom: '2026-11-17', lastActiveTo: '2026-11-01' }).success).toBe(false);
  });
  it('считает отсутствие языка отдельно и нумерует параметры каждой области независимо', () => {
    const unknown = advancedUserFiltersSchema.parse({ language: '__unknown__' });
    expect(advancedUserWhere(unknown, [12, null]).join('')).toContain("NULLIF(BTRIM(u.language_code),'') IS NULL");
    const sourceParams: unknown[] = [12, null, '%поиск%'];
    expect(userLanguageCondition('ru', sourceParams)).toContain('$4');
    expect(sourceParams).toEqual([12, null, '%поиск%', 'ru']);
  });
  it('отклоняет неизвестные поля, неверные даты и обратные диапазоны', () => {
    for (const value of [{ arbitrarySql: 'DROP' }, { registeredFrom: '2026-02-30' },
      { registeredFrom: '2026-11-17', registeredTo: '2026-11-01' }, { messagesMin: '5', messagesMax: '2' },
      { clicksMin: '-1' }, { variableMode: 'empty' }, { variableName: 'a', variableMode: 'equals' }]) expect(advancedUserFiltersSchema.safeParse(value).success).toBe(false);
  });
  it('передаёт имена и значения переменных только параметрами, сохраняя ноль', () => {
    const params: unknown[] = [12, null, '%поиск%'];
    const filters = advancedUserFiltersSchema.parse({ variableName: "a'); DROP TABLE bot_users;--", variableMode: 'equals',
      variableValue: "' OR TRUE --", messagesMax: '0', clicksMin: '2', language: 'EN' });
    const sql = advancedUserWhere(filters, params).join(' AND ');
    expect(sql).not.toContain('DROP TABLE'); expect(sql).not.toContain("' OR TRUE");
    expect(params).toEqual([12, null, '%поиск%', 'en', filters.variableName, filters.variableValue, 0, 2]);
    expect(sql).toContain('kind=\'message_in\''); expect(sql).toContain('kind=\'callback\'');
  });
  it('включает конечный день и не применяет число ботов к выбранному боту', () => {
    const sql = advancedUserWhere({ registeredTo: '2026-11-17', bots: 'multiple' }, [12, null]).join(' AND ');
    expect(sql).toContain('::date+1'); expect(sql).toContain('Europe/Moscow'); expect(sql).toContain('COUNT(DISTINCT ub.token_id)');
    expect(advancedUserWhere({ bots: 'multiple' }, [12, 9])).toEqual([]);
  });
});

/** Категория контакта участвует в серверном поиске до пагинации. */
it('валидирует и параметризует тип контакта', () => {
  const filters = advancedUserFiltersSchema.parse({ contactOrigin: 'group_history' });
  const params: unknown[] = [12,null];
  expect(advancedUserWhere(filters,params).join('')).toContain("THEN 'group_history'");
  expect(params).toEqual([12,null,'group_history']);
  expect(advancedUserFiltersSchema.safeParse({ contactOrigin: 'arbitrary' }).success).toBe(false);
});
