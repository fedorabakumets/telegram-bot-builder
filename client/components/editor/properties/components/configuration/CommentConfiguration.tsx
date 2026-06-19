/**
 * @fileoverview Панель свойств ноды-комментария
 * @module components/editor/properties/components/configuration/CommentConfiguration
 */

import { Node } from '@shared/schema';

/** Пропсы компонента конфигурации комментария */
interface CommentConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Колбэк обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node>) => void;
}

/** Доступные цвета заметки: значение и визуальный класс кружка */
const COMMENT_COLORS: Array<{ value: string; label: string; swatch: string }> = [
  { value: 'yellow', label: 'Жёлтый', swatch: 'bg-yellow-400' },
  { value: 'blue', label: 'Синий', swatch: 'bg-blue-400' },
  { value: 'green', label: 'Зелёный', swatch: 'bg-green-400' },
  { value: 'pink', label: 'Розовый', swatch: 'bg-pink-400' },
  { value: 'gray', label: 'Серый', swatch: 'bg-gray-400' },
];

/**
 * Панель свойств для ноды-комментария.
 * Содержит текстовое поле заметки и выбор цвета.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function CommentConfiguration({ selectedNode, onNodeUpdate }: CommentConfigurationProps) {
  const text = (selectedNode.data as any)?.messageText || '';
  const color = (selectedNode.data as any)?.commentColor || 'yellow';

  /** Обработчик изменения текста */
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNodeUpdate(selectedNode.id, { messageText: e.target.value });
  };

  /** Обработчик выбора цвета */
  const handleColorChange = (value: string) => {
    onNodeUpdate(selectedNode.id, { commentColor: value });
  };

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
        <i className="fas fa-sticky-note" />
        <span className="font-medium">Заметка на холсте — не влияет на логику бота</span>
      </div>

      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Напишите заметку..."
        className="w-full min-h-[120px] p-3 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-yellow-50/50 dark:bg-yellow-900/10 resize-y focus:outline-none focus:ring-2 focus:ring-yellow-300 dark:focus:ring-yellow-700"
      />

      {/* Выбор цвета заметки */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Цвет заметки</span>
        <div className="flex items-center gap-2">
          {COMMENT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => handleColorChange(c.value)}
              className={`w-7 h-7 rounded-full ${c.swatch} transition-transform hover:scale-110 ${
                color === c.value ? 'ring-2 ring-offset-2 ring-gray-500 dark:ring-offset-slate-900' : ''
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
