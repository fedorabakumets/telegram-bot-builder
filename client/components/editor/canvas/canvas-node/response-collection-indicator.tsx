/**
 * @fileoverview Компонент индикатора сбора ответов пользователей
 * 
 * Отображает информацию о сборе данных от пользователя:
 * текст, фото, видео, аудио, документы или множественный выбор.
 */

import { Node } from '@/types/bot';
import { ResponseItem } from './response-item';
import { ButtonResponses } from './button-responses';

/**
 * Интерфейс свойств компонента ResponseCollectionIndicator
 *
 * @interface ResponseCollectionIndicatorProps
 * @property {Node} node - Узел с настройками сбора ответов
 */
interface ResponseCollectionIndicatorProps {
  node: Node;
}

/**
 * Компонент индикатора сбора ответов
 *
 * @component
 * @description Отображает индикатор сбора данных от пользователя
 *
 * @param {ResponseCollectionIndicatorProps} props - Свойства компонента
 * @param {Node} props.node - Узел с настройками
 *
 * @returns {JSX.Element | null} Компонент индикатора или null если нет сбора ответов
 */
export function ResponseCollectionIndicator({ node }: ResponseCollectionIndicatorProps) {
  const collectUserInput = (node.data as any).collectUserInput;
  const inputVariable = (node.data as any).inputVariable;
  const photoInputVariable = (node.data as any).photoInputVariable;
  const videoInputVariable = (node.data as any).videoInputVariable;
  const audioInputVariable = (node.data as any).audioInputVariable;
  const documentInputVariable = (node.data as any).documentInputVariable;
  const multiSelectVariable = (node.data as any).multiSelectVariable;
  const allowMultipleSelection = (node.data as any).allowMultipleSelection;

  // Если это узел с collectUserInput и кнопками, это уже показано выше
  if (collectUserInput && node.data.buttons && node.data.buttons.length > 0 && node.data.keyboardType !== 'none') {
    return null;
  }

  // Проверяем если есть сбор ответов
  const hasResponseCollection = collectUserInput || inputVariable || photoInputVariable || 
                                videoInputVariable || audioInputVariable || documentInputVariable || 
                                multiSelectVariable;

  if (!hasResponseCollection) return null;

  // Проверяем если это узел с кнопками как ответами
  const hasButtonResponses = node.data.buttons && node.data.buttons.length > 0 && collectUserInput;

  return (
    <div className="space-y-2">
      {/* Button Responses Info */}
      {hasButtonResponses && (
        <ButtonResponses inputVariable={inputVariable} />
      )}

      {/* Text Input */}
      {!hasButtonResponses && inputVariable && (
        <ResponseItem type="text" variableName={inputVariable} />
      )}

      {/* Photo Input */}
      {!hasButtonResponses && photoInputVariable && (
        <ResponseItem type="photo" variableName={photoInputVariable} />
      )}

      {/* Video Input */}
      {!hasButtonResponses && videoInputVariable && (
        <ResponseItem type="video" variableName={videoInputVariable} />
      )}

      {/* Audio Input */}
      {!hasButtonResponses && audioInputVariable && (
        <ResponseItem type="audio" variableName={audioInputVariable} />
      )}

      {/* Document Input */}
      {!hasButtonResponses && documentInputVariable && (
        <ResponseItem type="document" variableName={documentInputVariable} />
      )}

      {/* Multi-Select Variable */}
      {!hasButtonResponses && multiSelectVariable && allowMultipleSelection && (
        <ResponseItem type="multi-select" variableName={multiSelectVariable} label="Множественный выбор" />
      )}
    </div>
  );
}
