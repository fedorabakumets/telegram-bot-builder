/**
 * @fileoverview Рабочая область: холст + resizable overlay detail справа
 * @module bot/canvas/BotsCanvasWorkspace
 */

import { useEffect, useMemo, useState } from 'react';
import { BotsCanvas } from './BotsCanvas';
import { BotDetailPanel } from './BotDetailPanel';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';
import { useBotControl } from '../bot-control-context';
import { useBotDetailPanelWidth } from './use-bot-detail-panel-width';
import type { BotProject, BotToken } from '@shared/schema';

/** Пропсы workspace холста */
interface BotsCanvasWorkspaceProps {
  /** Проект */
  project: BotProject;
  /** Токены проекта */
  tokens: BotToken[];
}

/**
 * Холст на весь контейнер; detail — overlay справа с ручкой ширины; sheet &lt;640px
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotsCanvasWorkspace({ project, tokens }: BotsCanvasWorkspaceProps) {
  const { allBotStatuses } = useBotControl();
  const useSheet = useMediaQuery('(max-width: 639px)');
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const { width: panelWidth, onResizePointerDown } = useBotDetailPanelWidth();

  useEffect(() => {
    setSelectedTokenId(null);
  }, [project.id]);

  const runningByTokenId = useMemo(() => {
    const map: Record<number, boolean> = {};
    for (const s of allBotStatuses) {
      const id = s.tokenId ?? s.instance?.tokenId;
      if (id != null) map[id] = s.status === 'running';
    }
    return map;
  }, [allBotStatuses]);

  const selectedToken = tokens.find((t) => t.id === selectedTokenId) ?? null;
  const overlayOpen = !!selectedToken && !useSheet;

  return (
    <div className="relative h-full min-h-0 rounded-lg border border-border overflow-hidden">
      <BotsCanvas
        projectId={project.id}
        tokens={tokens}
        runningByTokenId={runningByTokenId}
        selectedTokenId={selectedTokenId}
        onSelectToken={setSelectedTokenId}
        overlayPanelWidth={overlayOpen ? panelWidth : 0}
      />

      {overlayOpen && selectedToken && (
        <aside
          className={[
            'absolute inset-y-0 right-0 z-20 flex flex-col',
            'bg-background border-l border-border',
            'shadow-[-8px_0_24px_rgba(0,0,0,0.18)]',
            'animate-in slide-in-from-right duration-200',
          ].join(' ')}
          style={{ width: panelWidth }}
          data-bot-detail-overlay="true"
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Изменить ширину панели"
            title="Потяните, чтобы изменить ширину"
            onPointerDown={onResizePointerDown}
            className={[
              'group/resize absolute inset-y-0 left-0 z-30 w-3 -translate-x-1/2',
              'cursor-col-resize touch-none',
              'flex items-center justify-center',
            ].join(' ')}
          >
            <span className="h-10 w-1 rounded-full bg-border transition-colors group-hover/resize:bg-primary/70 group-active/resize:bg-primary" />
          </div>
          <BotDetailPanel
            project={project}
            token={selectedToken}
            isRunning={!!runningByTokenId[selectedToken.id]}
            onClose={() => setSelectedTokenId(null)}
          />
        </aside>
      )}

      {useSheet && (
        <Sheet
          open={!!selectedToken}
          onOpenChange={(open) => {
            if (!open) setSelectedTokenId(null);
          }}
        >
          <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
            {selectedToken && (
              <BotDetailPanel
                project={project}
                token={selectedToken}
                isRunning={!!runningByTokenId[selectedToken.id]}
                onClose={() => setSelectedTokenId(null)}
                compact
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
