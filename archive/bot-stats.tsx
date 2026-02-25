/**
 * @fileoverview Компонент для отображения статистики бота
 * Предоставляет подсчёт узлов, кнопок и других элементов структуры
 */

import { BotData } from '@shared/schema';
import { useMemo } from 'react';
import { BotStatsData, STATS_CONFIG } from './bot-stats-types';

/**
 * Свойства компонента статистики бота
 * @interface BotStatsProps
 */
interface BotStatsProps {
  /** Данные бота для подсчёта статистики */
  botData: BotData;
}

/**
 * Компонент для отображения статистики структуры бота
 * Подсчитывает количество узлов, кнопок и команд
 * @param botData - Данные бота для анализа
 * @returns JSX элемент компонента статистики
 */
export function BotStats({ botData }: BotStatsProps) {
  /**
   * Подсчёт статистики бота на основе его структуры
   * Извлекает узлы из всех листов и подсчитывает их по типам
   */
  const botStats = useMemo(() => {
    const allNodes: any[] = Array.isArray((botData as any).sheets)
      ? (botData as any).sheets.reduce((acc: any[], sheet: any) =>
          acc.concat(sheet.nodes || []), [])
      : botData.nodes || [];

    return {
      totalNodes: allNodes.length,
      commandNodes: allNodes.filter((node) =>
        node.type === 'start' || node.type === 'command'
      ).length,
      messageNodes: allNodes.filter((node) => node.type === 'message').length,
      photoNodes: allNodes.filter((node) => node.type === 'photo').length,
      keyboardNodes: allNodes.filter((node) =>
        node.data?.keyboardType !== 'none'
      ).length,
      totalButtons: allNodes.reduce(
        (sum: number, node: any) => sum + (node.data?.buttons?.length || 0),
        0
      ),
      commandsInMenu: allNodes.filter((node) =>
        (node.type === 'start' || node.type === 'command') &&
          node.data?.showInMenu
      ).length,
      adminOnlyCommands: allNodes.filter((node) =>
        (node.type === 'start' || node.type === 'command') &&
          node.data?.adminOnly
      ).length,
    } as BotStatsData;
  }, [botData]);

  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 xs:gap-2.5">
      {STATS_CONFIG.map((stat) => {
        const value = botStats[stat.key];
        if (value === 0) return null;

        return (
          <div
            key={stat.key}
            className={`bg-gray-50 ${stat.darkColorClass} border border-gray-200 dark:border-gray-800 rounded-lg p-2 xs:p-2.5 text-center`}
          >
            <div className={`text-lg xs:text-xl font-bold ${stat.colorClass}`}>
              {value}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
              {stat.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
