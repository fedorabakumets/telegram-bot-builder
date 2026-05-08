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
import { BroadcastStatusBadge } from './components/broadcast-status-badge';
import { NewBroadcastModal } from './wizard/new-broadcast-modal';
import { useBroadcasts } from './hooks/use-broadcasts';
import type { BroadcastPanelProps, Broadcast } from './types';

/**
 * Главная панель рассылок.
 * Показывает статистику, список рассылок и позволяет создать новую.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент панели рассылок
 */
export function BroadcastPanel({ projectId, selectedTokenId }: BroadcastPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const { broadcasts, isLoading, refetch } = useBroadcasts(projectId, selectedTokenId);

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
                onSelect={setSelectedBroadcast}
                selectedId={selectedBroadcast?.id}
              />
            )}
          </div>

          {/* Детали выбранной рассылки */}
          {selectedBroadcast && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{selectedBroadcast.name}</h3>
                <div className="flex items-center gap-2">
                  <BroadcastStatusBadge status={selectedBroadcast.status} />
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedBroadcast(null)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-center">
                <div className="border rounded p-2">
                  <div className="font-bold">{selectedBroadcast.totalCount}</div>
                  <div className="text-xs text-muted-foreground">Аудитория</div>
                </div>
                <div className="border rounded p-2">
                  <div className="font-bold text-green-600">{selectedBroadcast.deliveredCount}</div>
                  <div className="text-xs text-muted-foreground">Доставлено</div>
                </div>
                <div className="border rounded p-2">
                  <div className="font-bold text-red-500">{selectedBroadcast.failedCount}</div>
                  <div className="text-xs text-muted-foreground">Ошибок</div>
                </div>
              </div>
              {selectedBroadcast.createdAt && (
                <p className="text-xs text-muted-foreground">
                  Создана: {new Date(selectedBroadcast.createdAt).toLocaleString('ru-RU')}
                </p>
              )}
            </div>
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
