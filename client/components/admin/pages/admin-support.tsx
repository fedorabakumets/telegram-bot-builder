/**
 * @fileoverview Страница «Поддержка»: список диалогов и переписка
 * @module components/admin/pages/admin-support
 */

import { useState } from 'react';
import { useParams } from 'wouter';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/utils';
import { type AdminSupportFilter, useAdminSupportThreads } from '../hooks/use-admin-support';
import { SupportThreadList } from '../support/support-thread-list';
import { SupportThreadView } from '../support/support-thread-view';

/** Вкладки фильтра по статусу */
const FILTERS: { value: AdminSupportFilter; label: string }[] = [
  { value: 'open', label: 'Открытые' },
  { value: 'closed', label: 'Закрытые' },
  { value: 'all', label: 'Все' },
];

/**
 * Двухколоночная страница поддержки: слева диалоги, справа выбранная переписка
 * @returns JSX элемент страницы
 */
export function AdminSupportPage() {
  const params = useParams<{ id?: string }>();
  const selectedId = Number(params.id) > 0 ? Number(params.id) : null;
  const [filter, setFilter] = useState<AdminSupportFilter>('open');
  const { data, isLoading, error } = useAdminSupportThreads(filter);

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-80 shrink-0 flex-col border-r">
        <div className="border-b p-3">
          <h1 className="text-lg font-bold">Поддержка</h1>
          <div className="mt-2 flex gap-1">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs transition-colors',
                  filter === value
                    ? 'bg-blue-600 text-white'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {error && <p className="p-4 text-sm text-destructive">Не удалось загрузить диалоги.</p>}
          {data && <SupportThreadList items={data.items} selectedId={selectedId} />}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {selectedId ? (
          <SupportThreadView key={selectedId} threadId={selectedId} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Выберите диалог слева
          </div>
        )}
      </section>
    </div>
  );
}
