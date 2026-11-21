/** @fileoverview Предварительный просмотр переноса отдельных сессий Telegram в аккаунты проекта. */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/queryClient';
import type { LegacyTelegramMigrationPlan } from '@shared/project-telegram-account-migration';
import { AccountMigrationActions } from './account-migration-actions';

/** Подписи вариантов переноса. */
const dispositions = { create: 'Новый аккаунт', reuse: 'Существующий аккаунт', blocked: 'Перенос недоступен' };

/**
 * Знакомит владельца с группами переноса и показывает доступные операции.
 * @param props - Адрес API аккаунтов проекта и действие обновления.
 * @returns Кнопка и диалог предварительного просмотра.
 */
export function AccountMigrationPreview({ path, actorId, onChanged }: {
  /** Адрес списка аккаунтов. */ path: string;
  /** Владелец проекта, которому принадлежат кешированные результаты. */ actorId: number;
  /** Перечитывает карточки проекта после изменения. */ onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const url = `${path}/migration/preview`;
  const query = useQuery({
    queryKey: ['/api/projects', 'telegram-migration', url, actorId], enabled: open, staleTime: 0, retry: false,
    queryFn: (): Promise<LegacyTelegramMigrationPlan> => apiRequest('GET', url),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Проверить старые сессии</Button></DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Сессии, сохранённые у ботов</DialogTitle>
          <DialogDescription>Посмотрите, какие боты смогут перейти на общий Telegram-аккаунт.</DialogDescription>
        </DialogHeader>
        {query.isPending && <p role="status" className="text-sm text-muted-foreground">Проверяем сессии…</p>}
        {query.isError && (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">Не удалось проверить старые сессии.</p>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Повторить</Button>
          </div>
        )}
        {query.data?.groups.length === 0 && <p className="text-sm text-muted-foreground">Сессий для переноса пока нет.</p>}
        {!!query.data?.groups.length && (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {query.data.groups.map(group => (
              <li key={group.id} className="space-y-1 px-3 py-2">
                <p className="text-sm font-medium">{dispositions[group.disposition]}</p>
                <p className="break-words text-xs text-muted-foreground">{group.botNames.join(', ')}</p>
              </li>
            ))}
          </ul>
        )}
        {open && <AccountMigrationActions path={`${path}/migration`} actorId={actorId} groups={query.data?.groups ?? []}
          onChanged={() => { onChanged(); void query.refetch(); }} />}
      </DialogContent>
    </Dialog>
  );
}
