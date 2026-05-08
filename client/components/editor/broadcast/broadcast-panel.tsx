/**
 * @fileoverview Главная панель управления рассылками
 * @module client/components/editor/broadcast/broadcast-panel
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BroadcastStatsHeader } from './components/broadcast-stats-header';
import { BroadcastList } from './components/broadcast-list';
import { BroadcastDetail } from './components/broadcast-detail';
import { NewBroadcastModal } from './wizard/new-broadcast-modal';
import { useBroadcasts } from './hooks/use-broadcasts';
import type { BroadcastPanelProps, Broadcast } from './types';

/** Количество рассылок на одной странице */
const PAGE_LIMIT = 20;

/**
 * Главная панель рассылок.
 * Показывает статистику, список рассылок с пагинацией и детали выбранной.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент панели рассылок
 */
export function BroadcastPanel({ projectId, selectedTokenId }: BroadcastPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [page, setPage] = useState(1);

  const { broadcasts, total, isLoading, refetch } = useBroadcasts(projectId, selectedTokenId, page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  /** Обработчик выбора рассылки — сбрасывает предыдущий выбор при повторном клике */
  function handleSelect(broadcast: Broadcast) {
    setSelectedBroadcast((prev) => (prev?.id === broadcast.id ? null : broadcast));
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Шапка */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">📢 Рассылки</h2>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          + Новая рассылка
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-5">
          {/* Статистика */}
          {isLoading ? (
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 flex-1 rounded-lg" />)}
            </div>
          ) : (
            <BroadcastStatsHeader broadcasts={broadcasts} />
          )}

          {/* Список рассылок */}
          <div className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <BroadcastList
                broadcasts={broadcasts}
                onSelect={handleSelect}
                selectedId={selectedBroadcast?.id}
              />
            )}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Назад
              </Button>
              <span className="text-muted-foreground">
                Страница {page} из {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд →
              </Button>
            </div>
          )}

          {/* Детали выбранной рассылки */}
          {selectedBroadcast && (
            <BroadcastDetail
              broadcast={selectedBroadcast}
              projectId={projectId}
              onClose={() => setSelectedBroadcast(null)}
              refetch={refetch}
            />
          )}
        </div>
      </ScrollArea>

      <NewBroadcastModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        tokenId={selectedTokenId}
        refetch={refetch}
      />
    </div>
  );
}
