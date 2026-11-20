/**
 * @fileoverview Рабочая область: холст + resizable overlay detail справа
 * @module bot/canvas/BotsCanvasWorkspace
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { BotsCanvas } from './BotsCanvas';
import { BotDetailPanel } from './BotDetailPanel';
import { BotProjectDetailPanel } from './BotProjectDetailPanel';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';
import { useBotControl } from '../bot-control-context';
import { useBotDetailPanelWidth } from './use-bot-detail-panel-width';
import { buildFailureByTokenId } from './bot-service-failure';
import type { BotProject, BotToken } from '@shared/schema';

/** Пропсы workspace холста */
interface BotsCanvasWorkspaceProps {
  /** Проект */
  project: BotProject;
  /** Токены проекта */
  tokens: BotToken[];
}

/**
 * Холст вплотную к шапке, без своей рамки: линия шапки совпадает с сайдбаром.
 * Detail — overlay справа с ручкой ширины; sheet &lt;640px.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotsCanvasWorkspace({ project, tokens }: BotsCanvasWorkspaceProps) {
  const { allBotStatuses } = useBotControl();
  const useSheet = useMediaQuery('(max-width: 639px)');
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const projectPanelWasOpen = useRef(false);
  const { width: panelWidth, onResizePointerDown } = useBotDetailPanelWidth();

  useEffect(() => {
    /** Прямая ссылка из файлов открывает нужного бота и в режиме холста. */
    const requested = Number(new URLSearchParams(window.location.search).get('bot'));
    setSelectedTokenId(Number.isSafeInteger(requested) && requested > 0 ? requested : null);
    setSelectedProjectId(null);
  }, [project.id]);

  const runningByTokenId = useMemo(() => {
    const map: Record<number, boolean> = {};
    for (const s of allBotStatuses) {
      const id = s.tokenId ?? s.instance?.tokenId;
      if (id != null) map[id] = s.status === 'running';
    }
    return map;
  }, [allBotStatuses]);

  const failureByTokenId = useMemo(
    () => buildFailureByTokenId(allBotStatuses),
    [allBotStatuses],
  );

  const selectedToken = tokens.find((t) => t.id === selectedTokenId) ?? null;
  const projectSelected = selectedProjectId === project.id;
  const panelOpen = projectSelected || !!selectedToken;
  const overlayOpen = panelOpen && !useSheet;
  /** Закрывает панель независимо от выбранной карточки. */
  const closePanel = () => {
    setSelectedTokenId(null);
    setSelectedProjectId(null);
    if (projectSelected && !useSheet) {
      workspaceRef.current?.querySelector<HTMLButtonElement>('[data-bot-project-node]')?.focus();
    }
  };
  const panel = projectSelected ? (
    <BotProjectDetailPanel project={project} tokens={tokens} onClose={closePanel} compact={useSheet} />
  ) : selectedToken && (
    <BotDetailPanel
      project={project}
      token={selectedToken}
      isRunning={!!runningByTokenId[selectedToken.id]}
      onClose={closePanel}
      compact={useSheet}
    />
  );

  return (
    <div ref={workspaceRef} className="relative h-full min-h-0 overflow-hidden">
      <BotsCanvas
        projectId={project.id}
        projectName={project.name}
        projectLaunchMode={project.defaultLaunchMode ?? 'polling'}
        projectSelected={projectSelected}
        onSelectProject={() => {
          setSelectedTokenId(null);
          setSelectedProjectId(project.id);
          projectPanelWasOpen.current = true;
        }}
        tokens={tokens}
        runningByTokenId={runningByTokenId}
        failureByTokenId={failureByTokenId}
        selectedTokenId={selectedTokenId}
        onSelectToken={(tokenId) => {
          setSelectedProjectId(null);
          setSelectedTokenId(tokenId);
          projectPanelWasOpen.current = false;
        }}
        overlayPanelWidth={overlayOpen ? panelWidth : 0}
      />

      {overlayOpen && (
        <aside
          className={[
            'absolute inset-y-0 right-0 z-20 flex flex-col',
            'border-l border-border bg-background',
            'shadow-[-10px_0_28px_rgba(0,0,0,0.16)] dark:shadow-[-10px_0_32px_rgba(0,0,0,0.38)]',
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
            <span className="h-10 w-1 rounded-full bg-blue-500/25 transition-colors group-hover/resize:bg-blue-500/70 group-active/resize:bg-blue-500" />
          </div>
          {panel}
        </aside>
      )}

      {useSheet && (
        <Sheet
          open={panelOpen}
          onOpenChange={(open) => {
            if (!open) closePanel();
          }}
        >
          <SheetContent
            side="bottom"
            className="top-2 h-auto max-h-none gap-0 overflow-hidden rounded-t-xl p-0 flex flex-col"
            hideClose
            onCloseAutoFocus={(event) => {
              if (!projectPanelWasOpen.current) return;
              projectPanelWasOpen.current = false;
              const card = workspaceRef.current?.querySelector<HTMLButtonElement>('[data-bot-project-node]');
              if (card) {
                event.preventDefault();
                card.focus();
              }
            }}
          >
            {panel}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
