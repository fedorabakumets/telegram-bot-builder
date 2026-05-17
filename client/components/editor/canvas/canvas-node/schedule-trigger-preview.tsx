/**
 * @fileoverview Превью узла schedule_trigger на канвасе
 * @module components/editor/canvas/canvas-node/schedule-trigger-preview
 */

import { Node } from '@shared/schema';

/** Пропсы компонента превью */
interface ScheduleTriggerPreviewProps {
  /** Узел schedule_trigger */
  node: Node;
}

/**
 * Форматирует правило расписания в читаемую строку
 * @param rule - Правило расписания
 * @returns Человекочитаемое описание
 */
function formatRule(rule: any): string {
  if (!rule) return 'Не настроено';
  switch (rule.mode) {
    case 'interval':
      return `Каждые ${rule.intervalMinutes || 5} мин`;
    case 'weekday': {
      const dayNames: Record<string, string> = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' };
      const days = (rule.days || []).map((d: string) => dayNames[d] || d).join(', ');
      const time = `${String(rule.hour ?? 0).padStart(2, '0')}:${String(rule.minute ?? 0).padStart(2, '0')}`;
      return `${days} в ${time}`;
    }
    case 'monthday': {
      const dates = (rule.monthDays || []).join(', ');
      const time = `${String(rule.hour ?? 0).padStart(2, '0')}:${String(rule.minute ?? 0).padStart(2, '0')}`;
      return `${dates}-е числа в ${time}`;
    }
    case 'cron':
      return `cron: ${rule.cronExpression || '* * * * *'}`;
    default:
      return 'Не настроено';
  }
}

/**
 * Превью узла расписания на канвасе
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ScheduleTriggerPreview({ node }: ScheduleTriggerPreviewProps) {
  const data = node.data as any;
  const rules = data?.rules || [{ mode: 'interval', intervalMinutes: 5 }];
  const timezone = data?.timezone || 'Europe/Moscow';

  return (
    <div className="px-3 py-2 text-xs space-y-1">
      <div className="flex items-center gap-1.5 mb-1">
        <i className="fas fa-clock text-teal-500 text-[10px]" />
        <span className="font-semibold text-teal-700 dark:text-teal-300 text-[11px]">Расписание</span>
      </div>
      <div className="font-medium text-teal-700 dark:text-teal-300 truncate">
        {formatRule(rules[0])}
      </div>
      {rules.length > 1 && (
        <div className="text-teal-500 dark:text-teal-400 text-[10px]">
          +{rules.length - 1} правил(о)
        </div>
      )}
      <div className="text-gray-500 dark:text-gray-400 text-[10px] truncate">
        🌍 {timezone}
      </div>
    </div>
  );
}
