/** @fileoverview Одна кнопка под поиском раскрывает общие фильтры пользователей во всплывающей панели. */
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useDirectoryControls } from '../content/user-directory-controls';
import { SourceFilter } from '../components/filters/source-filter';
import { StatusFilter } from '../components/filters/status-filter';
import { PremiumFilter } from '../components/filters/premium-filter';
import { LanguageFilter } from '../components/filters/language-filter';
import { DialogAdvancedFilters } from './dialog-advanced-filters';
import { DialogMessagePeriod } from './dialog-message-period';
import './dialog-filters.css';

/** Область фильтров текущего списка переписок. */
interface DialogListFiltersProps {
  /** Идентификатор проекта. */ projectId: number;
  /** Выбранный бот либо весь проект. */ tokenId: number | null;
  /** Строка поиска текущего списка. */ search: string;
  /** Типы переписок, выбранные под фильтрами. */ dialogKind: 'all' | 'users' | 'groups' | 'channels';
}

/**
 * Переиспользует фильтры пользователей, сохраняя отдельное состояние только списка диалогов.
 * @param props - Проект, бот, поиск и выбранный вид переписки.
 * @returns Кнопка с числом условий и немодальная панель либо отсутствие кнопки для групп и каналов.
 */
export function DialogListFilters({ projectId, tokenId, search, dialogKind }: DialogListFiltersProps) {
  const controls = useDirectoryControls();
  if (!controls || dialogKind === 'groups' || dialogKind === 'channels') return null;
  const advanced = controls.advanced;
  /** Границы одного диапазона считаются одним условием, как в фильтрах пользователей. */
  const activeCount = [controls.source, controls.status !== 'all', controls.premium !== 'all', advanced.language,
    advanced.activity || advanced.lastActiveFrom || advanced.lastActiveTo, advanced.registeredFrom || advanced.registeredTo,
    advanced.messagesMin ?? advanced.messagesMax, advanced.clicksMin ?? advanced.clicksMax,
    tokenId === null && advanced.bots, advanced.variableName, advanced.contactOrigin, advanced.messageFrom || advanced.messageTo]
    .filter(value => value !== undefined && value !== false && value !== '').length;
  /** Сбрасывает ограничения профиля, сохраняя поиск, бота и выбранный диалог. */
  function reset() {
    controls!.setSource(''); controls!.setStatus('all'); controls!.setPremium('all'); controls!.setAdvanced({});
  }
  return <div className="dialogs-filter-launcher"><Popover>
    <PopoverTrigger asChild><Button type="button" variant="outline" size="sm" className="dialogs-filter-trigger"
      aria-label="Фильтры диалогов"><SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
      Фильтры{activeCount > 0 && <> · {activeCount}</>}
    </Button></PopoverTrigger>
    <PopoverContent side="right" align="start" sideOffset={8} collisionPadding={12}
      className="users-portal dialogs-filter-panel" aria-label="Фильтры личных диалогов">
    <div className="dialogs-filter-source"><SourceFilter projectId={projectId} tokenId={tokenId} /></div>
    <div className="dialogs-filter-primary-grid">
      {/** Статус устанавливается общим контролом; прежнего фильтра активности у диалогов нет. */}
      <StatusFilter value={controls.status} onChange={() => {}} />
      <PremiumFilter value={controls.premium} onChange={() => {}} />
    </div>
    <div className="dialogs-filter-language"><LanguageFilter value={controls.advanced.language}
      onChange={language => controls.setAdvanced({ ...controls.advanced, language })} /></div>
    <DialogMessagePeriod />
    <DialogAdvancedFilters projectId={projectId} tokenId={tokenId} search={search} />
    {activeCount > 0 && <div className="dialogs-filter-footer">
      <Button type="button" variant="ghost" size="sm" className="h-8 gap-2 text-xs text-muted-foreground" onClick={reset}>
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Сбросить фильтры
      </Button>
      {dialogKind === 'all' && <p className="text-xs leading-4 text-muted-foreground">Фильтры применяются к личным диалогам</p>}
    </div>}
    </PopoverContent>
  </Popover></div>;
}
