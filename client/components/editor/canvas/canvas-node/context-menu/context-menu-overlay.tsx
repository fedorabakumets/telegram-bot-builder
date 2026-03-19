/**
 * @fileoverview Прозрачная подложка для закрытия контекстного меню по клику вне него
 */

/**
 * Пропсы компонента подложки
 */
interface ContextMenuOverlayProps {
  /** Обработчик клика — закрывает меню */
  onClose: () => void;
}

/**
 * Полноэкранная прозрачная подложка поверх канваса.
 *
 * Закрывает меню по событию `mouseup`, а не `mousedown`, чтобы пункты меню
 * успели получить событие `click` до того, как меню будет скрыто.
 * Порядок событий браузера: mousedown → mouseup → click.
 * Если закрывать по mousedown — меню исчезает раньше, чем click доходит до кнопки.
 */
export function ContextMenuOverlay({ onClose }: ContextMenuOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[998]"
      onMouseUp={onClose}
    />
  );
}
