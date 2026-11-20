/** @fileoverview Компактные дополнительные селекторы с иконками, совпадающие с основными фильтрами. */
import type { AdvancedUserFilters } from '@shared/user-advanced-filters';
import { CalendarDays, MessageSquare, MousePointerClick, Bot, UsersRound } from 'lucide-react';
import { AdvancedChoice, AdvancedRange } from './advanced-filter-inputs';
import { LanguageFilter } from './language-filter';
import { VariableFilter } from './variable-filter';
/**
 * Редактирует черновик через компактные селекторы без подписей над основной строкой.
 * @param props - Значения и область выбранного бота.
 * @returns Сетка дополнительных фильтров в общем стиле.
 */
export function AdvancedFilterFields({ value, onChange, singleBot, projectId = 0, tokenId = null, search = '', hideLanguage = false }: {
  /** Скрывает язык, если он уже показан в основных фильтрах. */ hideLanguage?: boolean;
  /** Проект для загрузки имён переменных. */ projectId?: number;
  /** Текущая область бота. */ tokenId?: number | null;
  /** Поисковое ограничение аудитории. */ search?: string;
  /** Текущий черновик. */ value: AdvancedUserFilters;
  /** Изменение черновика. */ onChange: (value: AdvancedUserFilters) => void;
  /** Выбран один бот. */ singleBot: boolean;
}) {
  /** Пустое поле снимает только соответствующее ограничение. */
  function set(key: keyof AdvancedUserFilters, next: string) {
    onChange({ ...value, [key]: next === 'all' || next === '' ? undefined : next });
  }
  return <div className="users-advanced-grid grid gap-2 sm:grid-cols-2">
    <AdvancedRange icon={CalendarDays} label="Дата последней активности" type="date" min={value.lastActiveFrom} max={value.lastActiveTo}
      onMin={next => onChange({ ...value, activity: undefined, lastActiveFrom: next || undefined })}
      onMax={next => onChange({ ...value, activity: undefined, lastActiveTo: next || undefined })} />
    <AdvancedRange icon={CalendarDays} label="Дата первого обращения" type="date" min={value.registeredFrom} max={value.registeredTo}
      onMin={next => set('registeredFrom', next)} onMax={next => set('registeredTo', next)} />
    <AdvancedRange icon={MessageSquare} label="Входящие сообщения" min={value.messagesMin} max={value.messagesMax}
      onMin={next => set('messagesMin', next)} onMax={next => set('messagesMax', next)} />
    <AdvancedRange icon={MousePointerClick} label="Нажатия кнопок" min={value.clicksMin} max={value.clicksMax}
      onMin={next => set('clicksMin', next)} onMax={next => set('clicksMax', next)} />
    <div title={singleBot ? 'Доступно при выборе «Все боты»' : undefined}>
      <AdvancedChoice icon={Bot} label="Количество ботов" value={singleBot ? undefined : value.bots} disabled={singleBot}
        onChange={next => set('bots', next)} options={[[ 'all', 'Любое количество ботов' ], ['one', 'В одном боте'], ['multiple', 'В нескольких ботах']]} />
    </div>
    {!hideLanguage && <LanguageFilter value={value.language} onChange={next => onChange({ ...value, language: next })} />}
    <AdvancedChoice icon={UsersRound} label="Тип контакта" value={value.contactOrigin} onChange={next => set('contactOrigin',next)}
      options={[[ 'all', 'Все типы контактов' ], ['private', 'Личные обращения'], ['group_history', 'Из групповой истории'],
        ['imported', 'Импортированные контакты'], ['unknown', 'Без подтверждённого обращения']]} />
    <VariableFilter projectId={projectId} tokenId={tokenId} search={search} value={value} onChange={onChange} />
  </div>;
}
