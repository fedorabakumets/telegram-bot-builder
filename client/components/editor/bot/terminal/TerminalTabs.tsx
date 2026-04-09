/**
 * @fileoverview Компонент вкладок терминалов
 *
 * Отображает вкладки для переключения между живыми терминалами и историями запусков.
 *
 * @module bot/TerminalTabs
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import { Terminal, Bot, Clock } from 'lucide-react';
import type { TerminalInfo } from '../contexts/ActiveTerminalsContext';

/** Пропсы компонента вкладок терминалов */
interface TerminalTabsProps {
  /** Обработчик выбора терминала */
  onTerminalSelect: (key: string) => void;
}

/**
 * Возвращает строковый ключ вкладки
 * @param terminal - Информация о терминале
 * @returns Строковый ключ
 */
function getTabKey(terminal: TerminalInfo): string {
  return terminal.tabType === 'history'
    ? `history_${terminal.launchId}`
    : `${terminal.projectId}_${terminal.tokenId}`;
}

/**
 * Форматирует дату для заголовка вкладки истории
 * @param startedAt - Строка даты
 * @returns Короткая строка даты
 */
function formatTabDate(startedAt: string | null | undefined): string {
  if (!startedAt) return 'Запуск';
  return new Date(startedAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Вкладки терминалов с поддержкой live и history вкладок
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function TerminalTabs({ onTerminalSelect }: TerminalTabsProps) {
  const { terminals, activeTerminalId, setActiveTerminalById, removeTerminalById } = useActiveTerminals();

  if (terminals.length === 0) return null;

  /**
   * Обработчик смены вкладки
   * @param value - Ключ выбранной вкладки
   */
  const handleValueChange = (value: string) => {
    setActiveTerminalById(value);
    onTerminalSelect(value);
  };

  return (
    <Tabs value={activeTerminalId || ''} onValueChange={handleValueChange}>
      <TabsList className="w-full justify-start">
        {terminals.map(terminal => {
          const key = getTabKey(terminal);
          const isHistory = terminal.tabType === 'history';
          return (
            <TabsTrigger
              key={key}
              value={key}
              className="flex items-center gap-2"
            >
              {isHistory ? (
                <Clock className="w-3 h-3 text-blue-400" />
              ) : terminal.isRunning ? (
                <Terminal className="w-3 h-3 text-green-500" />
              ) : (
                <Bot className="w-3 h-3 text-gray-400" />
              )}
              <span className="max-w-[200px] truncate">
                {isHistory ? formatTabDate(terminal.launchStartedAt) : terminal.botName}
              </span>
              {!isHistory && terminal.isRunning && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
              {isHistory && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeTerminalById(key); }}
                  className="ml-1 text-muted-foreground/60 hover:text-muted-foreground transition-colors leading-none"
                  title="Закрыть"
                >
                  ×
                </button>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
