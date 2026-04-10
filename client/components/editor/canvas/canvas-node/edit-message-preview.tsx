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
    ? '🕐 Последнее сообщение'
    : `🆔 ${idManual.length > 20 ? idManual.slice(0, 20) + '…' : idManual || '—'}`;

  return (
    <div className="mb-4">
      {/* Пузырь сообщения — аналог MessagePreview */}
      <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50/80 to-sky-50/80 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-100 dark:border-blue-800/30">
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-500 mt-1.5 flex-shrink-0" />
          {showText && text.trim() ? (
            <FormattedText value={text} lineClamp={5} />
          ) : showText ? (
            <span className="text-sm italic text-muted-foreground opacity-60">Текст не задан</span>
          ) : (
            <span className="text-sm text-muted-foreground opacity-60">Редактирование кнопок</span>
          )}
        </div>
      </div>

      {/* Мета-информация под пузырём */}
      <div className="mt-1.5 px-1 space-y-0.5">
        <div className="text-[10px] text-sky-600 dark:text-sky-400">
          {sourceLabel}
        </div>
        {showKeyboard && keyboardMode !== 'keep' && (
          <div className="text-[10px] text-muted-foreground">
            {KEYBOARD_LABELS[keyboardMode]}
          </div>
        )}
      </div>
    </div>
  );
}
