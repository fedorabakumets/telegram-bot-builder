/** @fileoverview Переход из сведений файла к выбору блока для прикрепления. */
import { createContext, useContext, type ReactNode } from 'react';
import { Paperclip } from 'lucide-react';

/** Действие запуска режима прикрепления из конкретной карточки. */
const AttachActionContext = createContext<((id: number, button: HTMLElement) => void) | null>(null);

/** Параметры связи карточек с состоянием панели. */
interface AttachActionProviderProps {
  /** Содержимое области файлов. */
  children: ReactNode;
  /** Доступен ли выбор блока в панели. */
  enabled: boolean;
  /** Уже выбранные файлы. */
  selectedIds: Set<number>;
  /** Отметить файл, если он ещё не выбран. */
  onToggle: (id: number) => void;
  /** Включить режим прикрепления. */
  onEnable: (enabled: boolean) => void;
}

/**
 * Связывает действие карточки с режимом панели, сохраняя остальное выделение.
 * @param props - Состояние выбора и обработчики панели
 * @returns Область доступности действия
 */
export function FileAttachActionProvider({ children, enabled, selectedIds, onToggle, onEnable }: AttachActionProviderProps) {
  /** Включает режим, отмечает файл и фокусирует появившееся поле поиска блока. */
  const start = (id: number, button: HTMLElement) => {
    const panel = button.closest('[data-testid="file-storage-panel"]');
    if (!selectedIds.has(id)) onToggle(id);
    onEnable(true);
    requestAnimationFrame(() => {
      const search = panel?.querySelector<HTMLInputElement>('.file-node-picker input');
      search?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      search?.focus({ preventScroll: true });
    });
  };
  return <AttachActionContext.Provider value={enabled ? start : null}>{children}</AttachActionContext.Provider>;
}

/**
 * Предлагает прикрепить файл непосредственно из пустого состояния использования.
 * @param props - Идентификатор файла
 * @returns Кнопка запуска режима либо отсутствие элемента
 */
export function FileAttachAction({ fileId }: { /** Идентификатор файла. */ fileId: number }) {
  const start = useContext(AttachActionContext);
  return start ? <button type="button" className="files-message-link inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm"
    onClick={event => start(fileId, event.currentTarget)}><Paperclip className="h-4 w-4" aria-hidden="true" />Прикрепить к блоку</button> : null;
}
