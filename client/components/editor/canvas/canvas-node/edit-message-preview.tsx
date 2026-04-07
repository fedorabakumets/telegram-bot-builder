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

/** Метки режимов редактирования */
const MODE_LABELS: Record<string, string> = {
  text: 'Текст',
  markup: 'Кнопки',
  both: 'Текст и кнопки',
};

/**
 * Компонент превью узла редактирования сообщения на канвасе.
 * Отображает режим редактирования и первые 40 символов нового текста.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function EditMessagePreview({ node }: EditMessagePreviewProps) {
  const data = node.data as any;
  const editMode: string = data.editMode ?? 'text';
  const text: string = data.editMessageText ?? '';
  const showText = editMode !== 'markup';
  const isEmpty = showText && !text.trim();

  return (
    <div className="space-y-2 p-1">
      <div className="flex items-center gap-2">
        <span className="text-base">✏️</span>
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
          Редактировать сообщение
        </span>
      </div>

      {/* Режим редактирования */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <i className="fas fa-sliders-h text-blue-400" />
        <span>{MODE_LABELS[editMode] ?? editMode}</span>
      </div>

      {/* Текст сообщения */}
      {showText && (
        <div className="text-xs text-muted-foreground truncate max-w-full">
          {isEmpty ? (
            <span className="italic opacity-60">Текст не задан</span>
          ) : (
            <span className="font-mono text-blue-600 dark:text-blue-400 truncate">
              {text.length > 40 ? text.slice(0, 40) + '…' : text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
