/**
 * @fileoverview Компонент превью для узла типа "Голосовое сообщение"
 * 
 * Отображает визуальное представление голосового сообщения с иконкой,
 * статусом загрузки и продолжительностью аудио.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента VoicePreview
 *
 * @interface VoicePreviewProps
 * @property {Node} node - Узел типа voice для отображения
 */
interface VoicePreviewProps {
  node: Node;
}

/**
 * Компонент превью голосового сообщения
 *
 * @component
 * @description Отображает превью узла с голосовым сообщением
 *
 * @param {VoicePreviewProps} props - Свойства компонента
 * @param {Node} props.node - Узел типа voice
 *
 * @returns {JSX.Element} Компонент превью голосового сообщения
 */
export function VoicePreview({ node }: VoicePreviewProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-100/50 to-teal-100/50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
      <div className="text-center space-y-2">
        <i className="fas fa-microphone text-emerald-400 dark:text-emerald-300 text-3xl"></i>
        {node.data.voiceUrl ? (
          <div className="text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
            <div className="font-medium">Голосовое сообщение</div>
            {node.data.duration && (
              <div className="flex items-center justify-center space-x-1">
                <i className="fas fa-clock text-xs"></i>
                <span>{node.data.duration}с</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-emerald-500 dark:text-emerald-400">Добавьте URL голосового сообщения</div>
        )}
      </div>
    </div>
  );
}
