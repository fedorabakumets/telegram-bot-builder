/**
 * @fileoverview Компонент превью узла "Создать топик форума"
 *
 * Лаконично отображает название, цвет иконки, куда сохраняется ID и флаг skipIfExists.
 */

import { Node } from '@/types/bot';

/** Цвета иконок топиков Telegram (числовые значения → hex) */
const TOPIC_COLORS: Record<string, string> = {
  '7322096':  '#6FB9F0',
  '16766590': '#FFD67E',
  '13338331': '#CB86DB',
  '9367192':  '#8EEE98',
  '16749490': '#FF93B2',
  '16478047': '#FB6F5F',
};

/**
 * Компонент превью узла создания топика форума
 *
 * @param props - Свойства компонента
 * @param props.node - Узел create_forum_topic
 * @returns JSX элемент или null
 */
export function ForumTopicPreview({ node }: { node: Node }) {
  const { topicName, topicIconColor, saveThreadIdTo, skipIfExists } = node.data as any;

  if (!topicName && !saveThreadIdTo) return null;

  const color = topicIconColor ? TOPIC_COLORS[topicIconColor] ?? '#6FB9F0' : null;

  return (
    <div className="space-y-1.5 mb-3">
      {topicName && (
        <div className="flex items-center gap-2">
          {color && (
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
              style={{ backgroundColor: color }}
              title={`Цвет иконки: ${topicIconColor}`}
            />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
            {topicName}
          </span>
        </div>
      )}

      {saveThreadIdTo && (
        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
          → {saveThreadIdTo}
        </div>
      )}

      {skipIfExists && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          пропустить если существует
        </div>
      )}
    </div>
  );
}
