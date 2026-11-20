/** @fileoverview Компактная навигация между найденными сообщениями выбранного диалога. */
import { ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { useDialogMessageSearch } from '../hooks/use-dialog-message-search';

/**
 * Показывает поисковую фразу, положение совпадения и переходы по всей истории.
 * @param props - Состояние поиска и действия
 * @returns Панель поиска либо пустое представление
 */
export function DialogMessageSearchBar({ search }: { /** Поиск в текущем диалоге. */ search: ReturnType<typeof useDialogMessageSearch> }) {
  if (!search.visible) return null;
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 text-xs" role="search" aria-label="Найденные сообщения">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate" title={search.term}>
        {search.term ? `«${search.term}»` : 'Сообщения за период'}
        {search.term && (search.period.messageFrom || search.period.messageTo) ? ' · за период' : ''}
      </span>
      <span className="shrink-0 text-muted-foreground" role="status">
        {search.loading ? 'Ищем…' : search.failed ? 'Ошибка поиска' : search.count ? `${search.index + 1} из ${search.count}${search.hasMore ? '+' : ''}` : 'В сообщениях не найдено'}
      </span>
      {search.failed && <Button variant="ghost" className="dialogs-action h-7 px-2 text-xs" onClick={search.retry}>Повторить</Button>}
      <Button variant="ghost" size="icon" className="dialogs-action h-7 w-7" aria-label="Предыдущее совпадение"
        disabled={search.loading || search.index === 0} onClick={search.previous}><ArrowUp className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="dialogs-action h-7 w-7" aria-label="Следующее совпадение"
        disabled={search.loading || (!search.hasMore && search.index + 1 >= search.count)} onClick={() => void search.next()}><ArrowDown className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="dialogs-action h-7 w-7" aria-label="Закрыть поиск в переписке" onClick={search.close}><X className="h-4 w-4" /></Button>
    </div>
  );
}
