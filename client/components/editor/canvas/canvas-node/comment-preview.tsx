/**
 * @fileoverview Превью ноды-комментария на холсте
 * @module components/editor/canvas/canvas-node/comment-preview
 */

/** Пропсы компонента превью комментария */
interface CommentPreviewProps {
  /** Данные ноды */
  data: any;
}

/** Цветовые схемы заметки по значению commentColor */
const COLOR_STYLES: Record<string, { bg: string; icon: string; title: string }> = {
  yellow: {
    bg: 'bg-yellow-400/20 border border-yellow-400/40',
    icon: 'text-yellow-400',
    title: 'text-yellow-300',
  },
  blue: {
    bg: 'bg-blue-400/20 border border-blue-400/40',
    icon: 'text-blue-400',
    title: 'text-blue-300',
  },
  green: {
    bg: 'bg-green-400/20 border border-green-400/40',
    icon: 'text-green-400',
    title: 'text-green-300',
  },
  pink: {
    bg: 'bg-pink-400/20 border border-pink-400/40',
    icon: 'text-pink-400',
    title: 'text-pink-300',
  },
  gray: {
    bg: 'bg-gray-400/20 border border-gray-400/40',
    icon: 'text-gray-300',
    title: 'text-gray-200',
  },
};

/**
 * Компонент превью ноды-комментария на холсте.
 * Отображает текст заметки в стиле стикера с выбранным цветом.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function CommentPreview({ data }: CommentPreviewProps) {
  const text = data?.messageText || '';
  const color = data?.commentColor || 'yellow';
  const styles = COLOR_STYLES[color] || COLOR_STYLES.yellow;
  const truncated = text.length > 200 ? text.slice(0, 200) + '…' : text;

  return (
    <div className={`px-3 py-2 text-xs space-y-1 rounded-lg ${styles.bg}`}>
      <div className="flex items-center gap-1.5">
        <i className={`fas fa-sticky-note text-[10px] ${styles.icon}`} />
        <span className={`font-semibold text-[11px] ${styles.title}`}>Комментарий</span>
      </div>
      {truncated ? (
        <div className="text-gray-700 dark:text-gray-200 text-[11px] whitespace-pre-wrap break-words leading-relaxed">
          {truncated}
        </div>
      ) : (
        <div className="text-gray-400 dark:text-gray-500 text-[10px] italic">
          Пустая заметка
        </div>
      )}
    </div>
  );
}
