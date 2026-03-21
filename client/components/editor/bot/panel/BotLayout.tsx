/**
 * @fileoverview Компоновщик панели управления ботами
 *
 * На десктопе (md+): горизонтальный resizable split — боты слева, терминал справа.
 * На мобильных (< md): вкладки "Боты" / "Терминал" с переключением.
 * Вкладка терминала показывается только если есть активные терминалы.
 *
 * @module bot/BotLayout
 */

import { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { BotsPanel } from './BotsPanel';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import { Bot, Terminal } from 'lucide-react';

/** Вкладка мобильного layout */
type MobileTab = 'bots' | 'terminal';

interface BotLayoutProps {
  /** ID проекта */
  projectId: number;
  /** Название проекта */
  projectName: string;
}

/**
 * Компоновщик панели управления ботами
 */
export function BotLayout({ projectId, projectName }: BotLayoutProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('bots');
  const { terminals } = useActiveTerminals();
  const hasTerminals = terminals.length > 0;

  return (
    <>
      {/* Десктоп: горизонтальный resizable split */}
      <div className="hidden md:flex h-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={40} minSize={25}>
            <BotsPanel projectId={projectId} projectName={projectName} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={25}>
            <TerminalPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Мобильный: вкладки */}
      <div className="flex md:hidden flex-col h-full">
        {/* Таббар */}
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

        {/* Контент вкладок */}
        <div className="flex-1 overflow-hidden">
          <div className={mobileTab === 'bots' ? 'h-full' : 'hidden'}>
            <BotsPanel projectId={projectId} projectName={projectName} />
          </div>
          <div className={mobileTab === 'terminal' ? 'h-full' : 'hidden'}>
            <TerminalPanel />
          </div>
        </div>
      </div>
    </>
  );
}
