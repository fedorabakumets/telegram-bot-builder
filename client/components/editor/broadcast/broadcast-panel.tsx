/**
 * @fileoverview Главная панель управления рассылками — split layout
 * @module client/components/editor/broadcast/broadcast-panel
 */

import { useState } from 'react';
import { Plus, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BroadcastStatsHeader } from './components/broadcast-stats-header';
import { BroadcastList } from './components/broadcast-list';
import { BroadcastDetail } from './components/broadcast-detail';
import { BroadcastPagination } from './components/broadcast-pagination';
import { NewBroadcastModal } from './wizard/new-broadcast-modal';
import { useBroadcasts } from './hooks/use-broadcasts';
import type { BroadcastPanelProps, Broadcast } from './types';

/** Количество рассылок на одной странице */
const PAGE_LIMIT = 20;

/**
 * Главная панель рассылок со split-layout: список слева, детали справа.
 * @param props - Свойства компонента
 * @returns JSX элемент панели рассылок
 */
export function BroadcastPanel({ projectId, selectedTokenId }: BroadcastPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [page, setPage] = useState(1);

  const { broadcasts, total, isLoading, refetch } = useBroadcasts(projectId, selectedTokenId, page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  /** Обработчик выбора рассылки — сбрасывает при повторном клике */
  function handleSelect(broadcast: Broadcast) {
    setSelectedBroadcast((prev) => (prev?.id === broadcast.id ? null : broadcast));
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Шапка с градиентом */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-muted/40 to-background">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2">
            <Radio className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-none">Рассылки</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total > 0 ? `${total} рассыл${total === 1 ? 'ка' : total < 5 ? 'ки' : 'ок'}` : 'Нет рассылок'}
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Новая рассылка
        </Button>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 min-h-0">
        {/* Левая колонка — список */}
        <div className={`flex flex-col min-h-0 transition-all ${selectedBroadcast ? 'w-[40%]' : 'w-full'} border-r`}>
          <ScrollArea className="flex-1">
            <div className="px-4 py-4 space-y-4">
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
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
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
                <BroadcastPagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Правая колонка — детали выбранной рассылки */}
        {selectedBroadcast && (
          <div className="w-[60%] min-h-0 flex flex-col">
            <BroadcastDetail
              broadcast={selectedBroadcast}
              projectId={projectId}
              onClose={() => setSelectedBroadcast(null)}
              refetch={refetch}
            />
          </div>
        )}
      </div>

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
