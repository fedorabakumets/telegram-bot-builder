/**
 * @fileoverview Компонент кнопок межпроектного копирования и вставки
 * 
 * Содержит кнопки для копирования и вставки узлов между проектами
 * в компоненте Canvas.
 */

/**
 * Свойства компонента кнопок буфера обмена
 */
interface ClipboardButtonsProps {
  /** Колбэк для копирования в буфер обмена */
  onCopyToClipboard?: (nodeIds: string[]) => void;
  /** Колбэк для вставки из буфера обмена */
  onPasteFromClipboard?: (offsetX?: number, offsetY?: number) => void;
  /** Позиция последнего клика для вставки */
  lastClickPosition?: { x: number; y: number };
  /** Transform последнего клика (pan и zoom) */
  clickTransform?: { pan: { x: number; y: number }; zoom: number };
  /** Идентификатор выбранного узла */
  selectedNodeId: string | null;
  /** Наличие данных в буфере обмена */
  hasClipboardData?: boolean;
}

/**
 * Компонент кнопок межпроектного копирования и вставки
 * 
 * @param props - Свойства компонента
 * @returns JSX элемент с кнопками копирования/вставки
 */
export function ClipboardButtons({
  onCopyToClipboard,
  onPasteFromClipboard,
  lastClickPosition,
  clickTransform,
  selectedNodeId,
  hasClipboardData
}: ClipboardButtonsProps) {
  /**
   * Базовые классы для кнопок
   */
  const buttonBaseClasses = 'flex-shrink-0 p-0 h-9 w-9 rounded-xl border transition-colors duration-200 group flex items-center justify-center';
  
  /**
   * Классы для неактивной кнопки
   */
  const inactiveClasses = 'bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70';
  
  /**
   * Классы для иконки копирования
   */
  const copyIconClasses = 'text-slate-600 dark:text-slate-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors';
  
  /**
   * Классы для иконки вставки
   */
  const pasteIconClasses = 'text-slate-600 dark:text-slate-400 text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors';

  /**
   * Обработчик клика кнопки вставки
   * Вычисляет canvas-координаты из lastClickPosition или вставляет без координат (центр)
   */
  const handlePasteClick = () => {
    if (!onPasteFromClipboard) return;
    if (lastClickPosition && clickTransform) {
      // Правильная формула: (screen - pan) / zoom
      const targetX = (lastClickPosition.x - clickTransform.pan.x) / (clickTransform.zoom / 100);
      const targetY = (lastClickPosition.y - clickTransform.pan.y) / (clickTransform.zoom / 100);
      onPasteFromClipboard(targetX, targetY);
    } else {
      // Fallback — pasteFromClipboard сам использует центр видимой области
      onPasteFromClipboard();
    }
  };

  return (
    <>
      {onCopyToClipboard && selectedNodeId && (
        <button
          onClick={() => onCopyToClipboard([selectedNodeId])}
          className={`${buttonBaseClasses} ${inactiveClasses}`}
          title="Копировать в буфер (Shift + Ctrl + C)"
        >
          <i className={`fas fa-clipboard ${copyIconClasses}`} />
        </button>
      )}

      {onPasteFromClipboard && hasClipboardData && (
        <button
          onClick={handlePasteClick}
          className={`${buttonBaseClasses} ${inactiveClasses}`}
          title="Вставить из буфера (Shift + Ctrl + V)"
        >
          <i className={`fas fa-paste ${pasteIconClasses}`} />
        </button>
      )}
    </>
  );
}
