/**
 * @fileoverview Превью узла "Редактировать сообщение" на канвасе
 * @module components/editor/canvas/canvas-node/edit-message-preview
 */
import { Node } from '@shared/schema';

/** Пропсы компонента превью */
interface EditMessagePreviewProps {
  /** Узел редактирования сообщения */
  node: Node;
}

/** Иконки режимов редактирования */
const MODE_ICONS: Record<string, string> = {
  text:   'fas fa-font',
  markup: 'fas fa-keyboard',
  both:   'fas fa-layer-group',
};

/** Метки действий с клавиатурой */
const KEYBOARD_LABELS: Record<string, string> = {
  keep:   '⏸ Клавиатура не меняется',
  remove: '🗑 Убрать кнопки',
  node:   '⌨️ Из узла keyboard',
};

/**
 * Превью узла редактирования сообщения на канвасе.
 * Показывает заголовок, источник ID, текст и действие с клавиатурой.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function EditMessagePreview({ node }: EditMessagePreviewProps) {
  const data = node.data as any;

  const editMode: string       = data.editMode ?? 'text';
  const idSource: string       = data.editMessageIdSource ?? 'last_bot_message';
  const idManual: string       = data.editMessageIdManual ?? '';
  const text: string           = data.editMessageText ?? '';
  const keyboardMode: string   = data.editKeyboardMode ?? 'keep';

  const showText     = editMode === 'text' || editMode === 'both';
  const showKeyboard = editMode === 'markup' || editMode === 'both';

  /** Метка источника ID сообщения */
  const sourceLabel = idSource === 'last_bot_message'
    ? '🕐 Последнее сообщение бота'
    : `🆔 ${idManual.length > 22 ? idManual.slice(0, 22) + '…' : idManual || '—'}`;

  return (
    <div className="space-y-2 p-1">

      {/* Заголовок */}
      <div className="flex items-center gap-2">
        <i className={`${MODE_ICONS[editMode] ?? 'fas fa-pen'} text-blue-400 text-sm`} />
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
          Редактировать сообщение
        </span>
      </div>

      {/* Источник ID сообщения */}
      <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
        {sourceLabel}
      </div>

      {/* Новый текст */}
      {showText && (
        <div className="text-xs font-mono text-blue-500 dark:text-blue-300 truncate max-w-full">
          {text.trim()
            ? (text.length > 45 ? text.slice(0, 45) + '…' : text)
            : <span className="italic opacity-50 font-sans">Текст не задан</span>
          }
        </div>
      )}

      {/* Действие с клавиатурой */}
      {showKeyboard && (
        <div className="text-[10px] text-muted-foreground">
          {KEYBOARD_LABELS[keyboardMode] ?? keyboardMode}
        </div>
      )}

    </div>
  );
}
