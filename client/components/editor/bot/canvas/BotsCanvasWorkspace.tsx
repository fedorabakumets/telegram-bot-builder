/**
 * @fileoverview Рабочая область холста: canvas + resizable detail справа / sheet на узких экранах
 * @module bot/canvas/BotsCanvasWorkspace
 */

import { useEffect, useMemo, useState } from 'react';
import { BotsCanvas } from './BotsCanvas';
import { BotDetailPanel } from './BotDetailPanel';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';
import { useBotControl } from '../bot-control-context';
import type { BotProject, BotToken } from '@shared/schema';

/** Пропсы workspace холста */
interface BotsCanvasWorkspaceProps {
  /** Проект */
  project: BotProject;
  /** Токены проекта */
  tokens: BotToken[];
}

/**
 * Холст ботов: справа resizable detail (как Railway); sheet только &lt;640px
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotsCanvasWorkspace({ project, tokens }: BotsCanvasWorkspaceProps) {
  const { allBotStatuses } = useBotControl();
  /** Узкий экран — bottom sheet; иначе правая панель с ручкой */
  const useSheet = useMediaQuery('(max-width: 639px)');
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

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

  const canvas = (
    <BotsCanvas
      projectId={project.id}
      tokens={tokens}
      runningByTokenId={runningByTokenId}
      selectedTokenId={selectedTokenId}
      onSelectToken={setSelectedTokenId}
    />
  );

  if (useSheet) {
    return (
      <div className="h-full min-h-0">
        {canvas}
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
      </div>
    );
  }

  if (!selectedToken) {
    return (
      <div className="h-full min-h-0 rounded-lg border border-border overflow-hidden">
        {canvas}
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 rounded-lg border border-border overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={55} minSize={25} className="min-w-0">
          {canvas}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={45} minSize={25} maxSize={75} className="min-w-0">
          <BotDetailPanel
            project={project}
            token={selectedToken}
            isRunning={!!runningByTokenId[selectedToken.id]}
            onClose={() => setSelectedTokenId(null)}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
