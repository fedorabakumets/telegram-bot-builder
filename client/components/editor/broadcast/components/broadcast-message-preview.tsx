/**
 * @fileoverview Пузырь предпросмотра сообщения рассылки
 * @description Показывает текст, медиа и инлайн-кнопки как в Telegram.
 */

import { useMemo } from 'react';
import type { Button } from '@shared/schema';
import { parseHTML } from '@/components/editor/inline-rich/utils/formatting-parser';
import { MediaPreviewList } from './media-preview';

/**
 * Пропсы компонента BroadcastMessagePreview
 */
interface BroadcastMessagePreviewProps {
  /** HTML-текст сообщения */
  messageText: string;
  /** URL или JSON file_id прикреплённых медиа */
  mediaUrls?: string[];
  /** Инлайн-кнопки */
  buttons?: Button[];
  /** Кол-во кнопок в ряду (0 = все в один ряд) */
  buttonsPerRow?: number;
  /** ID проекта для прокси Telegram file_id */
  projectId: number;
  /** ID токена для прокси Telegram file_id */
  tokenId?: number | null;
  /** Показывать подпись «Предпросмотр:» над пузырём */
  showLabel?: boolean;
}

/**
 * Возвращает CSS-класс цвета кнопки по стилю Telegram
 * @param style - Стиль кнопки
 * @returns CSS-классы
 */
function getButtonStyleClass(style?: Button['style']): string {
  switch (style) {
    case 'primary':
      return 'bg-blue-500/15 border-blue-400 text-blue-700 dark:text-blue-300';
    case 'success':
      return 'bg-green-500/15 border-green-400 text-green-700 dark:text-green-300';
    case 'danger':
      return 'bg-red-500/15 border-red-400 text-red-700 dark:text-red-300';
    default:
      return 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300';
  }
}

/**
 * Рендерит одну кнопку предпросмотра
 * @param button - Данные кнопки
 * @param index - Индекс кнопки
 * @returns JSX элемент кнопки
 */
function PreviewButton({ button, index }: { button: Button; index: number }) {
  const label = button.text?.trim() || 'Кнопка';
  const className = `inline-flex items-center justify-center px-2 py-1 text-xs rounded-md border text-center ${getButtonStyleClass(button.style)}`;

  if (button.action === 'url' && button.url) {
    return (
      <a
        key={button.id ?? index}
        href={button.url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <div key={button.id ?? index} className={className}>
      {label}
    </div>
  );
}

/**
 * Раскладывает кнопки по рядам согласно buttonsPerRow
 * @param buttons - Список кнопок
 * @param buttonsPerRow - Кнопок в ряду
 * @returns JSX сетки кнопок
 */
function PreviewButtons({ buttons, buttonsPerRow = 0 }: { buttons: Button[]; buttonsPerRow?: number }) {
  if (buttons.length === 0) return null;

  if (buttonsPerRow <= 0) {
    return (
      <div className="flex flex-wrap gap-1 w-full">
        {buttons.map((button, index) => (
          <PreviewButton key={button.id ?? index} button={button} index={index} />
        ))}
      </div>
    );
  }

  const rows: Button[][] = [];
  for (let i = 0; i < buttons.length; i += buttonsPerRow) {
    rows.push(buttons.slice(i, i + buttonsPerRow));
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
        >
          {row.map((button, index) => (
            <PreviewButton key={button.id ?? `${rowIndex}-${index}`} button={button} index={index} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Пузырь предпросмотра сообщения рассылки с медиа, текстом и кнопками
 * @param props - Свойства компонента
 * @returns JSX элемент предпросмотра или null
 */
export function BroadcastMessagePreview({
  messageText,
  mediaUrls = [],
  buttons = [],
  buttonsPerRow = 0,
  projectId,
  tokenId,
  showLabel = true,
}: BroadcastMessagePreviewProps): React.JSX.Element | null {
  const hasText = messageText.trim().length > 0;
  const hasMedia = mediaUrls.length > 0;
  const hasButtons = buttons.length > 0;

  const formattedText = useMemo(() => {
    if (!hasText) return null;
    return parseHTML(messageText.trimEnd());
  }, [hasText, messageText]);

  if (!hasText && !hasMedia && !hasButtons) return null;

  return (
    <div className="space-y-1">
      {showLabel && <p className="text-xs text-muted-foreground">Предпросмотр:</p>}
      <div className="rounded-xl rounded-tl-sm bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/40 dark:to-violet-950/30 border border-blue-100 dark:border-blue-900/40 p-3 space-y-2 max-h-80 overflow-auto">
        {hasMedia && (
          <MediaPreviewList
            mediaUrls={mediaUrls}
            projectId={projectId}
            tokenId={tokenId}
            compact
          />
        )}

        {formattedText && (
          <p className="text-sm whitespace-pre-wrap break-words">{formattedText}</p>
        )}

        {hasButtons && (
          <PreviewButtons buttons={buttons} buttonsPerRow={buttonsPerRow} />
        )}
      </div>
    </div>
  );
}
