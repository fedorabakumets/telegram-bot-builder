/**
 * @fileoverview Компоновщик панели управления ботами
 *
 * На десктопе (md+): горизонтальный resizable split, боты слева, терминал справа.
 * В режиме холста — только панель ботов (терминал внутри detail-панели).
 * На мобильных: вкладки "Боты" / "Терминал" с переключением.
 *
 * Важно: одновременно должен монтироваться только один layout.
 */

import { lazy, Suspense, useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';
import { Bot, Terminal } from 'lucide-react';
import { BotsPanel } from './BotsPanel';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import { useBotViewMode } from '../canvas/use-bot-view-mode';

/**
 * Панель терминала внутри вкладки «Бот».
 * Чанк запрашивается при показе панели, а не вместе с холстом.
 */
const TerminalPanel = lazy(() =>
  import('../../terminal/TerminalPanel').then((m) => ({ default: m.TerminalPanel })),
);

/**
 * Компактный фолбек загрузки терминала. Не перекрывает весь редактор.
 * @returns JSX-элемент индикатора
 */
function TerminalPanelFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground" role="status">
      <i className="fas fa-spinner fa-spin text-xs" aria-hidden="true" />
    </div>
  );
}

type MobileTab = 'bots' | 'terminal';

interface BotLayoutProps {
  projectId: number;
  projectName: string;
  /** Список всех проектов для переключателя */
  allProjects?: Array<{ id: number; name: string }>;
  /** Обработчик смены проекта */
  onProjectChange?: (projectId: number) => void;
}

/**
 * Корневой layout вкладки «Бот»
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotLayout({ projectId, projectName, allProjects, onProjectChange }: BotLayoutProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('bots');
  const { terminals } = useActiveTerminals();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { viewMode } = useBotViewMode();
  const hasTerminals = terminals.length > 0;
  const isCanvas = viewMode === 'canvas';

  if (isDesktop) {
    if (isCanvas) {
      return (
        <div className="h-full">
          <BotsPanel
            projectId={projectId}
            projectName={projectName}
            allProjects={allProjects}
            onProjectChange={onProjectChange}
          />
        </div>
      );
    }

    return (
      <div className="h-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={50} minSize={30}>
            <BotsPanel projectId={projectId} projectName={projectName} allProjects={allProjects} onProjectChange={onProjectChange} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={25}>
            <Suspense fallback={<TerminalPanelFallback />}>
              <TerminalPanel />
            </Suspense>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {!isCanvas && (
        <div className="flex border-b border-border bg-background flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('bots')}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
              mobileTab === 'bots'
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
            aria-label="Управление ботами"
          >
            <Bot className="w-4 h-4" />
            Боты
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('terminal')}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
              mobileTab === 'terminal'
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
            aria-label="Терминал"
          >
            <Terminal className="w-4 h-4" />
            Терминал
            {hasTerminals && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        {(isCanvas || mobileTab === 'bots') ? (
          <div className="h-full">
            <BotsPanel projectId={projectId} projectName={projectName} allProjects={allProjects} onProjectChange={onProjectChange} />
          </div>
        ) : (
          <div className="h-full">
            <Suspense fallback={<TerminalPanelFallback />}>
              <TerminalPanel />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
