/**
 * @fileoverview Превью узла "Уведомление при нажатии на inline кнопку" на канвасе
 * @module components/editor/canvas/canvas-node/answer-callback-query-preview
 */
import { Node } from '@shared/schema';

/** Пропсы компонента превью узла ответа на callback_query */
interface AnswerCallbackQueryPreviewProps {
  /** Узел уведомления при нажатии на inline кнопку */
  node: Node;
}

/**
 * Компонент превью узла ответа на callback_query на канвасе.
 * Отображает текст уведомления и тип отображения (тост/алерт).
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function AnswerCallbackQueryPreview({ node }: AnswerCallbackQueryPreviewProps) {
  const data = node.data as any;
  const text: string = data.callbackNotificationText || '';
  const showAlert: boolean = !!data.callbackShowAlert;
  const isEmpty = !text.trim();

  return (
    <div className="space-y-2 p-1">
      <div className="flex items-center gap-2">
        <span className="text-base">🔔</span>
        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
          Уведомление inline-кнопки
        </span>
      </div>

      {/* Текст уведомления */}
      <div className="text-xs text-muted-foreground truncate max-w-full">
        {isEmpty ? (
          <span className="italic opacity-60">Текст не задан</span>
        ) : (
          <span className="font-mono text-purple-600 dark:text-purple-400 truncate">
            {text.length > 40 ? text.slice(0, 40) + '…' : text}
          </span>
        )}
      </div>

      {/* Тип отображения */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <i className={showAlert ? 'fas fa-exclamation-circle text-amber-500' : 'fas fa-info-circle text-purple-400'} />
        <span>{showAlert ? 'Алерт' : 'Тост'}</span>
      </div>
    </div>
  );
}
