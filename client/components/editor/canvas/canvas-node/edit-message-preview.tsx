/**
 * @fileoverview Превью узла "Редактировать сообщение" на канвасе
 * @module components/editor/canvas/canvas-node/edit-message-preview
 */
import { Node } from '@shared/schema';

/** Пропсы компонента превью узла редактирования сообщения */
interface EditMessagePreviewProps {
  /** Узел редактирования сообщения */
  node: Node;
}

/**
 * Конфигурация режима редактирования: иконка и метка
 */
interface ModeConfig {
  /** CSS-класс иконки FontAwesome */
  icon: string;
  /** Человекочитаемая метка */
  label: string;
}

/** Конфигурации режимов редактирования */
const MODE_CONFIG: Record<string, ModeConfig> = {
  text:   { icon: 'fas fa-font',        label: 'Текст' },
  markup: { icon: 'fas fa-keyboard',    label: 'Кнопки' },
  both:   { icon: 'fas fa-layer-group', label: 'Текст + кнопки' },
};

/** Метки действий с клавиатурой */
const KEYBOARD_LABELS: Record<string, string> = {
  keep:   '⏸ Не менять',
  remove: '🗑 Убрать кнопки',
  node:   '⌨️ Из узла keyboard',
};

/**
 * Компонент превью узла редактирования сообщения на канвасе.
 * Отображает источник сообщения, режим редактирования, текст и действие с клавиатурой.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function EditMessagePreview({ node }: EditMessagePreviewProps) {
  const data = node.data as any;

  const editMode: string        = data.editMode ?? 'text';
  const messageSource: string   = data.editMessageIdSource ?? 'last_bot_message';
  const customId: string        = data.editMessageIdManual ?? '';
  const text: string            = data.editMessageText ?? '';
  const keyboardAction: string  = data.editKeyboardMode ?? 'keep';

  const showText     = editMode === 'text' || editMode === 'both';
  const showKeyboard = editMode === 'markup' || editMode === 'both';

  const sourceLabel = messageSource === 'last_bot_message'
    ? '🕐 Последнее сообщение'
    : `🆔 ${customId.length > 20 ? customId.slice(0, 20) + '…' : customId || '—'}`;

  const modeConfig = MODE_CONFIG[editMode] ?? { icon: 'fas fa-edit', label: editMode };

  return (
    <div className="space-y-1.5 p-1">

      {/* Источник сообщения */}
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">
        <span>{sourceLabel}</span>
      </div>

      <div className="border-t border-sky-200 dark:border-sky-800" />

      {/* Режим редактирования */}
      <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400">
        <i className={`${modeConfig.icon} w-3 text-center`} />
        <span className="font-medium">{modeConfig.label}</span>

        {/* Текст сообщения — inline после режима */}
        {showText && (
          <span className="font-mono text-blue-500 dark:text-blue-300 truncate max-w-[120px]">
            {text.trim()
              ? (text.length > 50 ? text.slice(0, 50) + '…' : text)
              : <span className="italic opacity-50 not-italic">не задан</span>
            }
          </span>
        )}
      </div>

      {/* Действие с клавиатурой */}
      {showKeyboard && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>{KEYBOARD_LABELS[keyboardAction] ?? keyboardAction}</span>
        </div>
      )}

    </div>
  );
}
