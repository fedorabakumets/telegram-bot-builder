/**
 * @fileoverview Компоновщик панели управления ботами
 *
 * Компонент объединяет левую панель со списком ботов
 * и правую панель с терминалами в resizable-контейнере.
 *
 * @module bot/BotLayout
 */

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { BotsPanel } from './BotsPanel';
import { TerminalPanel } from './TerminalPanel';

interface BotLayoutProps {
  projectId: number;
  projectName: string;
}

/**
 * Компоновщик панели управления ботами
 */
export function BotLayout({ projectId, projectName }: BotLayoutProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={60} minSize={20}>
        <BotsPanel projectId={projectId} projectName={projectName} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={40} minSize={20}>
        <TerminalPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
