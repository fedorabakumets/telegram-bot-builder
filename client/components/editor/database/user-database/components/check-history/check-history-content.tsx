/** @fileoverview История внутри окна запуска проверки без отдельного диалога или внешней кнопки. */
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import type { CheckHistoryKind } from '@shared/check-history';
import { Button } from '@/components/ui/button';
import { useCheckHistory, useCheckHistoryDetail } from './use-check-history';
import { CheckHistoryList } from './check-history-list';
import { CheckHistoryDetails } from './check-history-details';
import { DeleteCheckHistoryButton } from './delete-check-history-button';
/** Встраивает прошлые результаты в существующее окно проверки. @param props - Вид, область и доступность загрузки. @returns Список либо раскрытые подробности. */
export function CheckHistoryContent({ projectId, tokenId, kind, enabled = true }: {
  /** Проект истории. */ projectId: number;
  /** Бот либо все участники проекта. */ tokenId: number | null;
  /** Вид проверки. */ kind: CheckHistoryKind;
  /** Загружать только в открытом окне. */ enabled?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const history = useCheckHistory(projectId, tokenId, kind, enabled);
  const detail = useCheckHistoryDetail(projectId, enabled ? selected : null);
  useEffect(() => { setSelected(null); }, [projectId, tokenId, kind, enabled]);
  const items = history.data?.pages.flatMap(page => page.items) ?? [];
  const failed = selected ? detail.isError : history.isError;
  const loading = selected ? detail.isPending : history.isPending;
  return <section className="space-y-3 border-t border-border pt-3" aria-label="Прошлые проверки">
    <div className="flex items-center justify-between gap-2">
      {selected ? <Button type="button" variant="ghost" size="sm" className="h-8 gap-2" onClick={() => setSelected(null)}><ArrowLeft className="h-4 w-4" />К списку проверок</Button> : <h3 className="text-sm font-medium">Прошлые проверки</h3>}
      <Button type="button" variant="outline" size="sm" className="h-8 gap-2" disabled={history.isFetching || detail.isFetching} onClick={() => { void (selected ? detail.refetch() : history.refetch()); }}><RefreshCw className="h-4 w-4" />Обновить</Button>
    </div>
    {failed ? <p role="alert" className="text-sm text-destructive">Не удалось загрузить историю. Повторите запрос.</p> : loading ? <p role="status" className="text-sm text-muted-foreground">Загрузка истории…</p> : selected && detail.data ? <CheckHistoryDetails data={detail.data} /> : <>
      {items.length ? <CheckHistoryList items={items} onSelect={setSelected} /> : <p className="py-3 text-sm text-muted-foreground">Прошлых проверок пока нет</p>}
      {history.hasNextPage && <Button type="button" variant="outline" size="sm" disabled={history.isFetchingNextPage} onClick={() => { void history.fetchNextPage(); }}>{history.isFetchingNextPage ? 'Загрузка…' : 'Показать ещё'}</Button>}
    </>}
    {items.length > 0 && <DeleteCheckHistoryButton projectId={projectId} tokenId={tokenId} kind={kind} onDeleted={() => setSelected(null)} />}
  </section>;
}
