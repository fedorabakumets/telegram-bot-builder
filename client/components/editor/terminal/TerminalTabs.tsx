/**
 * @fileoverview Компонент вкладок терминалов
 *
 * Select для переключения между живыми терминалами и историями запусков.
 * В подписи — проект и число пользователей бота; список отсортирован по убыванию пользователей.
 *
 * @module bot/TerminalTabs
 */

import { useMemo } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useActiveTerminals } from '../bot/contexts/ActiveTerminalsContext';
import type { TerminalInfo } from '../bot/contexts/ActiveTerminalsContext';
import { useBotQueries } from '../bot/hooks/use-bot-queries';
import { useTerminalUserCounts } from './use-terminal-user-counts';

/** Пропсы компонента вкладок терминалов */
interface TerminalTabsProps {
  /** Обработчик выбора терминала */
  onTerminalSelect: (key: string) => void;
}

/**
 * Форматирует число пользователей для компактной подписи.
 * @param value - Количество пользователей
 * @returns Строка вида `142` или `1.2k`
 */
function formatUserCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

/**
 * Возвращает строковый ключ вкладки терминала.
 * @param terminal - Данные вкладки
 * @returns Ключ для activeTerminalId
 */
function getTabKey(terminal: TerminalInfo): string {
  return terminal.tabType === 'history'
    ? `history_${terminal.launchId}`
    : `${terminal.projectId}_${terminal.tokenId}`;
}

/**
 * Собирает подпись пункта селектора терминала.
 * @param terminal - Данные вкладки
 * @param projectNames - Карта названий проектов
 * @param userCounts - Карта числа пользователей по `${projectId}_${tokenId}`
 * @returns Текст для SelectItem
 */
function getTerminalLabel(
  terminal: TerminalInfo,
  projectNames: Map<number, string>,
  userCounts: Map<string, number>,
): string {
  const projectName = projectNames.get(terminal.projectId) ?? `Проект #${terminal.projectId}`;
  const statsKey = `${terminal.projectId}_${terminal.tokenId}`;
  const userCount = userCounts.get(statsKey);
  const usersSuffix = userCount !== undefined ? ` · ${formatUserCount(userCount)} польз.` : '';

  if (terminal.tabType === 'history') {
    const dateLabel = terminal.launchStartedAt
      ? new Date(terminal.launchStartedAt).toLocaleString('ru-RU', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Запуск';
    return `📜 ${dateLabel} · ${projectName}${usersSuffix}`;
  }

  return `${terminal.botName} · ${projectName}${usersSuffix}`;
}

/**
 * Возвращает число пользователей для сортировки; неизвестные значения — в конец списка.
 * @param terminal - Данные вкладки
 * @param userCounts - Карта числа пользователей
 * @returns Число для сравнения
 */
function getSortableUserCount(terminal: TerminalInfo, userCounts: Map<string, number>): number {
  return userCounts.get(`${terminal.projectId}_${terminal.tokenId}`) ?? -1;
}

/**
 * Сортирует терминалы: сначала с большим числом пользователей, затем live, затем по имени бота.
 * @param terminals - Список вкладок
 * @param userCounts - Карта числа пользователей
 * @returns Отсортированная копия списка
 */
function sortTerminalsByUserCount(
  terminals: TerminalInfo[],
  userCounts: Map<string, number>,
): TerminalInfo[] {
  return [...terminals].sort((left, right) => {
    const userDiff =
      getSortableUserCount(right, userCounts) - getSortableUserCount(left, userCounts);
    if (userDiff !== 0) return userDiff;

    const liveDiff = Number(right.tabType === 'history') - Number(left.tabType === 'history');
    if (liveDiff !== 0) return liveDiff;

    return left.botName.localeCompare(right.botName, 'ru');
  });
}

/**
 * Вкладки терминалов с поддержкой live и history вкладок.
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function TerminalTabs({ onTerminalSelect }: TerminalTabsProps) {
  const { terminals, activeTerminalId, setActiveTerminalById } = useActiveTerminals();
  const { projects } = useBotQueries();
  const userCounts = useTerminalUserCounts(terminals);

  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  const sortedTerminals = useMemo(
    () => sortTerminalsByUserCount(terminals, userCounts),
    [terminals, userCounts],
  );

  if (terminals.length === 0) return null;

  const handleSelectChange = (value: string) => {
    setActiveTerminalById(value);
    onTerminalSelect(value);
  };

  return (
    <Select value={activeTerminalId || ''} onValueChange={handleSelectChange}>
      <SelectTrigger className="h-7 max-w-[min(100%,480px)] text-xs">
        <SelectValue placeholder="Выберите терминал" />
      </SelectTrigger>
      <SelectContent>
        {sortedTerminals.map((terminal) => {
          const key = getTabKey(terminal);
          return (
            <SelectItem key={key} value={key} className="text-xs">
              {getTerminalLabel(terminal, projectNames, userCounts)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
