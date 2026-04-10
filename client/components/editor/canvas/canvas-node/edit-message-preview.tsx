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
    ? 'Последнее сообщение'
    : idManual.length > 24 ? idManual.slice(0, 24) + '…' : idManual || '—';

  const sourceIcon = idSource === 'last_bot_message' ? 'fas fa-clock' : 'fas fa-hashtag';

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-pen text-blue-500 text-sm" />
        <span className="font-semibold text-blue-700 dark:text-blue-300 text-base">
          Редактировать сообщение
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

      {/* Мета-информация */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-sm text-sky-600 dark:text-sky-400 font-medium">
          <i className={`${sourceIcon} text-xs`} />
          <span>{sourceLabel}</span>
        </div>
        {showKeyboard && keyboardMode !== 'keep' && (
          <div className="text-sm text-muted-foreground">
            {KEYBOARD_LABELS[keyboardMode]}
          </div>
        )}
      </div>
    </div>
  );
}
