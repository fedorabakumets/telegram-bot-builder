/**
 * @fileoverview Контекстное меню узла канваса
 *
 * Появляется по правому клику на блоке, содержит действия над узлом.
 * Рендерится через портал в document.body чтобы избежать влияния трансформаций канваса.
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ContextMenuPosition, ContextMenuItem } from './context-menu-types';
import { ContextMenuItemComponent } from './context-menu-item';
import { ContextMenuSeparator } from './context-menu-separator';
import { ContextMenuOverlay } from './context-menu-overlay';

/**
 * Пропсы контекстного меню узла
 */
interface NodeContextMenuProps {
  /** Позиция меню на экране */
  position: ContextMenuPosition;
  /** Обработчик закрытия меню */
  onClose: () => void;
  /** Пункты основной группы */
  items: ContextMenuItem[];
  /** Пункты опасной группы (удаление и т.п.) */
  dangerItems?: ContextMenuItem[];
}

/**
 * Контекстное меню с автоматической корректировкой позиции у краёв экрана
 */
export function NodeContextMenu({ position, onClose, items, dangerItems }: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  /** Корректируем позицию чтобы меню не выходило за края экрана */
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { innerWidth, innerHeight } = window;
    const rect = el.getBoundingClientRect();
    if (rect.right > innerWidth) el.style.left = `${position.x - rect.width}px`;
    if (rect.bottom > innerHeight) el.style.top = `${position.y - rect.height}px`;
  }, [position]);

  const handleAction = (fn: () => void) => {
    fn();
    onClose();
  };

  return createPortal(
    <>
      <ContextMenuOverlay onClose={onClose} />
      <div
        ref={menuRef}
        className="fixed z-[999] min-w-[180px] rounded-xl border border-white/10 bg-slate-800/95 backdrop-blur-md shadow-2xl p-1.5"
        style={{ left: position.x, top: position.y }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {items.map((item) => (
          <ContextMenuItemComponent key={item.id} item={item} onAction={handleAction} />
        ))}

        {dangerItems && dangerItems.length > 0 && (
          <>
            <ContextMenuSeparator />
            {dangerItems.map((item) => (
              <ContextMenuItemComponent key={item.id} item={item} onAction={handleAction} />
            ))}
          </>
        )}
      </div>
    </>,
    document.body
  );
}
