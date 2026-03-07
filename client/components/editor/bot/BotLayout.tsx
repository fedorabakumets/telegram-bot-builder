/**
 * @fileoverview Компоновщик панели управления ботами
 *
 * Компонент объединяет левую панель со списком ботов
 * и правую панель с терминалами в resizable-контейнере.
 *
 * @module bot/BotLayout
 */

import { ResizablePanelGroup } from '@/components/ui/resizable';
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
        <BotsPanel defaultSize={60} />
        <ResizableHandle withHandle />
        <TerminalPanel defaultSize={40} />
      </ResizablePanelGroup>
    </ActiveTerminalsProvider>
  );
}
