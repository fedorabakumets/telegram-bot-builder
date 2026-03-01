/**
 * @fileoverview Содержимое секции текста сообщения
 * 
 * Компонент с редактором текста и информационным блоком.
 */

import { InlineRichEditor } from '../../inline-rich/inline-rich-editor';
import { MessageInfoBlock } from '../common/message-info-block';
import type { Variable } from '../../inline-rich/types';
import type { FormatMode } from '../../inline-rich/types';

/** Пропсы содержимого секции текста */
interface MessageTextSectionContentProps {
  /** ID узла */
  nodeId: string;
  /** Текущий текст сообщения */
  messageText: string;
  /** Флаг включения Markdown */
  markdown?: boolean;
  /** Режим форматирования */
  formatMode?: FormatMode;
  /** Доступные переменные */
  availableVariables: Variable[];
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
  formatMode,
  availableVariables,
  onNodeUpdate,
  onMediaVariableSelect
}: MessageTextSectionContentProps) {
  return (
    <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-950/30 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-200/40 dark:border-blue-800/40 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-2 sm:space-y-2.5">
        <InlineRichEditor
          value={messageText}
          onChange={(value) => onNodeUpdate(nodeId, { messageText: value })}
          placeholder="Введите текст сообщения..."
          enableMarkdown={markdown}
          onFormatModeChange={(newFormatMode) => onNodeUpdate(nodeId, { formatMode: newFormatMode })}
          availableVariables={availableVariables}
          onMediaVariableSelect={onMediaVariableSelect}
        />
        <MessageInfoBlock variant="blue" />
      </div>
    </div>
  );
}
