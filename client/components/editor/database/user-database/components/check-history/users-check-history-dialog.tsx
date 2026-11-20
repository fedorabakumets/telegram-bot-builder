/** @fileoverview Компактное окно истории проверок с пагинацией и сохранёнными подробностями. */
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import type { CheckHistoryKind } from '@shared/check-history';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCheckHistory, useCheckHistoryDetail } from './use-check-history';
import { CheckHistoryList } from './check-history-list';
import { CheckHistoryDetails } from './check-history-details';
/** Показывает прошлые проверки, не отправляя запросов к Telegram. @param props - Вид, область и управление окном. @returns История. */
export function UsersCheckHistoryDialog({ projectId, tokenId, kind, open, onOpenChange }: {
  /** Проект истории. */ projectId: number;
  /** Фильтр участника запусков либо все боты. */ tokenId: number | null;
  /** Вид проверок. */ kind: CheckHistoryKind;
  /** Открыто ли окно. */ open: boolean;
  /** Изменение видимости. */ onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const history = useCheckHistory(projectId, tokenId, kind, open);
  const detail = useCheckHistoryDetail(projectId, open ? selected : null);
  useEffect(() => { setSelected(null); }, [projectId, tokenId, kind, open]);
  const items = history.data?.pages.flatMap(page => page.items) ?? [];
  const failed = selected ? detail.isError : history.isError;
  const loading = selected ? detail.isPending : history.isPending;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="users-portal max-h-[85vh] gap-3 overflow-y-auto p-5 sm:max-w-xl">
    <DialogHeader><DialogTitle>История проверок {kind === 'private-chats' ? 'личных чатов' : 'ботов'}</DialogTitle><DialogDescription>Сохранённые запуски и результаты. Время указано в часовом поясе устройства.</DialogDescription></DialogHeader>
    <div className="flex items-center justify-between gap-2">{selected ? <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => setSelected(null)}><ArrowLeft className="h-4 w-4" />К истории</Button> : <span className="text-xs text-muted-foreground">{tokenId ? `Запуски с участием бота #${tokenId}` : 'Все боты проекта'}</span>}
      <Button variant="outline" size="sm" className="h-8 gap-2" disabled={history.isFetching || detail.isFetching} onClick={() => { void (selected ? detail.refetch() : history.refetch()); }}><RefreshCw className="h-4 w-4" />Обновить</Button></div>
    {failed ? <p role="alert" className="text-sm text-destructive">Не удалось загрузить историю. Повторите запрос.</p> : loading ? <p role="status" className="text-sm text-muted-foreground">Загрузка…</p> : selected && detail.data ? <CheckHistoryDetails data={detail.data} /> : <>
      {items.length ? <CheckHistoryList items={items} onSelect={setSelected} /> : <p className="py-6 text-center text-sm text-muted-foreground">Прошлых проверок пока нет</p>}
      {history.hasNextPage && <Button variant="outline" disabled={history.isFetchingNextPage} onClick={() => { void history.fetchNextPage(); }}>{history.isFetchingNextPage ? 'Загрузка…' : 'Показать ещё'}</Button>}
    </>}
  </DialogContent></Dialog>;
}
