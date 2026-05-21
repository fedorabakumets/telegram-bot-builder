/**
 * @fileoverview Компонент вкладок терминалов
 *
 * Отображает вкладки для переключения между живыми терминалами и историями запусков.
 * На мобильных устройствах вместо вкладок показывается компактный Select-селектор
 * с опцией "Все" для одновременного отображения всех терминалов.
 *
 * @module bot/TerminalTabs
 */

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useActiveTerminals } from '../bot/contexts/ActiveTerminalsContext';
import type { TerminalInfo } from '../bot/contexts/ActiveTerminalsContext';

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
  const { terminals, activeTerminalId, setActiveTerminalById } = useActiveTerminals();

  if (terminals.length === 0) return null;

  /**
   * Обработчик смены значения в Select
   * @param value - Ключ выбранной опции
   */
  const handleSelectChange = (value: string) => {
    setActiveTerminalById(value);
    onTerminalSelect(value);
  };

  return (
    <Select
      value={activeTerminalId || ''}
      onValueChange={handleSelectChange}
    >
      <SelectTrigger className="h-7 text-xs w-auto max-w-[300px]">
        <SelectValue placeholder="Выберите терминал" />
      </SelectTrigger>
      <SelectContent>
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
  );
}
