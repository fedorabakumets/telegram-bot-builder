/**
 * @fileoverview Компонент вкладок терминалов
 *
 * Отображает вкладки для переключения между живыми терминалами и историями запусков.
 * На мобильных устройствах вместо вкладок показывается компактный Select-селектор
 * с опцией "Все" для одновременного отображения всех терминалов.
 *
 * @module bot/TerminalTabs
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import { Terminal, Bot, Clock } from 'lucide-react';
import type { TerminalInfo } from '../contexts/ActiveTerminalsContext';

/** Специальное значение для отображения всех терминалов */
export const ALL_TERMINALS_VALUE = 'all';

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
 * Возвращает отображаемое имя терминала для Select-опции
 * @param terminal - Информация о терминале
 * @returns Строка с именем
 */
function getTerminalLabel(terminal: TerminalInfo): string {
  if (terminal.tabType === 'history') {
    return `📜 ${formatTabDate(terminal.launchStartedAt)}`;
  }
  return terminal.botName;
}

/**
 * Вкладки терминалов с поддержкой live и history вкладок.
 * На мобильных — компактный Select, на десктопе — TabsList.
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function TerminalTabs({ onTerminalSelect }: TerminalTabsProps) {
  const { terminals, activeTerminalId, setActiveTerminalById, removeTerminalById } = useActiveTerminals();

  if (terminals.length === 0) return null;

  /**
   * Обработчик смены вкладки (десктоп)
   * @param value - Ключ выбранной вкладки
   */
  const handleValueChange = (value: string) => {
    setActiveTerminalById(value);
    onTerminalSelect(value);
  };

  /**
   * Обработчик смены значения в мобильном Select
   * @param value - Ключ выбранной опции или 'all'
   */
  const handleSelectChange = (value: string) => {
    setActiveTerminalById(value);
    if (value !== ALL_TERMINALS_VALUE) {
      onTerminalSelect(value);
    }
  };

  return (
    <>
      {/* Мобильный: компактный Select-селектор */}
      <div className="sm:hidden px-2 py-1">
        <Select
          value={activeTerminalId || ALL_TERMINALS_VALUE}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger className="h-7 text-xs w-full">
            <SelectValue placeholder="Выберите терминал" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TERMINALS_VALUE} className="text-xs">
              Все
            </SelectItem>
            {terminals.map(terminal => {
              const key = getTabKey(terminal);
              return (
                <SelectItem key={key} value={key} className="text-xs">
                  {getTerminalLabel(terminal)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Десктоп: стандартные вкладки */}
      <div className="hidden sm:block">
        <Tabs value={activeTerminalId || ''} onValueChange={handleValueChange}>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            <TabsList className="w-max min-w-full justify-start">
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
                    <span>
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
          </div>
        </Tabs>
      </div>
    </>
  );
}
