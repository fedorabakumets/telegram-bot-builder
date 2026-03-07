/**
 * @fileoverview Содержимое секции текста сообщения
 *
 * Компонент с редактором текста сообщения.
 */

import { InlineRichEditor } from '../../../inline-rich/inline-rich-editor';
import type { ProjectVariable } from '../../utils/variables-utils';
import type { FormatMode, Variable } from '../../../inline-rich/types';

/** Пропсы содержимого секции текста */
interface MessageTextSectionContentProps {
  /** ID узла */
  nodeId: string;
  /** Текущий текст сообщения */
  messageText: string;
  /** Флаг включения Markdown */
  markdown?: boolean;
  /** Режим форматирования (не используется) */
  _formatMode?: FormatMode;
  /** Доступные переменные */
  availableVariables: ProjectVariable[];
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция выбора медиа-переменной */
  onMediaVariableSelect?: (name: string, mediaType: string) => void;
}

/**
 * Компонент содержимого секции текста сообщения
 * 
 * @param {MessageTextSectionContentProps} props - Пропсы компонента
 * @returns {JSX.Element} Содержимое секции текста
 */
export function MessageTextSectionContent({
  nodeId,
  messageText,
  markdown,
  availableVariables,
  onNodeUpdate,
  onMediaVariableSelect
}: MessageTextSectionContentProps) {
  return (
    <div className="space-y-2 sm:space-y-2.5">
      <InlineRichEditor
        value={messageText}
        onChange={(value: string) => onNodeUpdate(nodeId, { messageText: value })}
        placeholder="Введите текст сообщения..."
        enableMarkdown={markdown}
        onFormatModeChange={(newFormatMode: FormatMode) => onNodeUpdate(nodeId, { formatMode: newFormatMode })}
        availableVariables={availableVariables as Variable[]}
        onMediaVariableSelect={onMediaVariableSelect}
      />
    </div>
  );
}
