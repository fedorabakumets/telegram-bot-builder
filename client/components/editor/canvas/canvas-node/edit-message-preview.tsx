/**
 * @fileoverview Превью узла "Редактировать сообщение" на канвасе
 * @module components/editor/canvas/canvas-node/edit-message-preview
 */
import { Node } from '@shared/schema';
import { FormattedText } from '@/components/editor/inline-rich/components/FormattedText';

/** Пропсы компонента превью */
interface EditMessagePreviewProps {
  /** Узел редактирования сообщения */
  node: Node;
}

/** Метки действий с клавиатурой */
const KEYBOARD_LABELS: Record<string, string> = {
  keep:   '⏸ Клавиатура не меняется',
  remove: '🗑 Убрать кнопки',
  node:   '⌨️ Из узла keyboard',
};

/**
 * Превью узла редактирования сообщения на канвасе.
 * Стиль аналогичен MessagePreview — пузырь с градиентом.
 * Заголовок рендерится через NodeHeader, здесь только содержимое.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function EditMessagePreview({ node }: EditMessagePreviewProps) {
  const data = node.data as any;

  const editMode: string     = data.editMode ?? 'text';
  const idSource: string     = data.editMessageIdSource ?? 'last_bot_message';
  const idManual: string     = data.editMessageIdManual ?? '';
  const text: string         = data.editMessageText ?? '';
  const keyboardMode: string = data.editKeyboardMode ?? 'keep';

  const showText     = editMode === 'text' || editMode === 'both';
  const showKeyboard = editMode === 'markup' || editMode === 'both';

  /** Метка источника ID редактируемого сообщения */
  const sourceLabel = idSource === 'last_bot_message'
    ? 'последнее'
    : idManual.length > 18 ? idManual.slice(0, 18) + '…' : idManual || '—';

  return (
    <div>
      {/* Заголовок + источник на одной строке */}
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-pen text-blue-500 text-sm" />
        <span className="font-semibold text-blue-700 dark:text-blue-300 text-base">
          Редактировать сообщение
        </span>
        <span className="text-sm text-sky-500 dark:text-sky-400 font-mono ml-auto truncate max-w-[100px]">
          {sourceLabel}
        </span>
      </div>

      {/* Пузырь — аналог MessagePreview */}
      <div className="rounded-xl p-4 mb-3 bg-gradient-to-br from-blue-50/80 to-sky-50/80 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-100 dark:border-blue-800/30">
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-500 mt-1.5 flex-shrink-0" />
          {showText && text.trim() ? (
            <FormattedText value={text} lineClamp={6} />
          ) : showText ? (
            <span className="text-sm italic text-muted-foreground opacity-60">Текст не задан</span>
          ) : (
            <span className="text-sm text-muted-foreground opacity-60">Редактирование кнопок</span>
          )}
        </div>
      </div>

      {/* Действие с клавиатурой */}
      {showKeyboard && keyboardMode !== 'keep' && (
        <div className="mt-1.5 px-1 text-sm text-muted-foreground">
          {KEYBOARD_LABELS[keyboardMode]}
        </div>
      )}
    </div>
  );
}
