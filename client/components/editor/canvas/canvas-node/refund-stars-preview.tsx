/**
 * @fileoverview Превью узла «Вернуть звёзды» на холсте
 * @module components/editor/canvas/canvas-node/refund-stars-preview
 */

/** Пропсы превью возврата */
interface RefundStarsPreviewProps {
  /** Данные узла refund_stars */
  data: any;
}

/**
 * Краткое превью: кому и код покупки
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function RefundStarsPreview({ data }: RefundStarsPreviewProps) {
  const source = data?.refundUserSource || 'current_user';
  const who =
    source === 'custom'
      ? (data?.refundUserId || 'ID…')
      : 'текущий пользователь';
  const charge = data?.refundChargeId || 'код не задан';

  return (
    <div className="px-3 py-2 space-y-1 text-[11px] leading-snug">
      <div className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-300">
        <i className="fas fa-undo text-[10px]" />
        <span className="font-medium truncate">{who}</span>
      </div>
      <div className="text-muted-foreground truncate font-mono text-[10px]">{charge}</div>
    </div>
  );
}
