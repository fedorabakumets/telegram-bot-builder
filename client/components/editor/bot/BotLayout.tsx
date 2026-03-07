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
import { ActiveTerminalsProvider } from './ActiveTerminalsContext';

/**
 * Компоновщик панели управления ботами
 */
export function BotLayout() {
  return (
    <ActiveTerminalsProvider>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={60} minSize={30}>
          <BotsPanel />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <TerminalPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </ActiveTerminalsProvider>
  );
}
