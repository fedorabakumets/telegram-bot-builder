/**
 * @fileoverview Тонкий контейнер `FileStorageModal` — встраивает переиспользуемую
 * панель `FileStoragePanel` в режиме `modal` внутри компактного закрываемого окна
 * (shadcn `Dialog`). Окно визуально компактнее полноэкранной страницы, имеет явные
 * границы и кнопку закрытия (Req 1.2, 1.4). Внутри модалки можно сменить проект и
 * бота (Req 1.5). Никакой дублирующейся логики — вся реализация в FileStoragePanel
 * (Req 1.6); контейнер только адаптирует пропсы и пробрасывает закрытие.
 * @module components/editor/files/containers/file-storage-modal
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileStoragePanel } from '../panel/file-storage-panel';
import type { AttachTarget, SheetInfo } from '../panel/panel-types';

/** Пропсы контейнера модалки файлового хранилища */
export interface FileStorageModalProps {
  /** Открыта ли модалка */
  open: boolean;
  /** Смена состояния открытия (закрытие по крестику/оверлею/Esc) */
  onOpenChange: (open: boolean) => void;
  /** ID проекта */
  projectId: number;
  /** Выбранный токен бота (для приоритизации file_id) */
  selectedTokenId?: number | null;
  /** Обработчик выбора токена */
  onSelectToken: (tokenId: number | null) => void;
  /** Список проектов для переключателя (смена проекта внутри модалки — Req 1.5) */
  allProjects: Array<{ id: number; name: string }>;
  /** Обработчик смены проекта */
  onProjectChange: (projectId: number) => void;
  /** Цель прикрепления выбранных файлов к ноде */
  attachTarget?: AttachTarget | null;
  /** Прикрепить выбранные файлы к ноде (запись в attachedMedia) */
  onAttach?: (fileRefs: string[]) => void;
  /** Все листы проекта (для столбца «используется в нодах») */
  allSheets?: SheetInfo[];
}

/**
 * Контейнер-модалка «Файлы»: рендерит FileStoragePanel в режиме `modal`
 * внутри компактного Dialog. Панель сама вызывает onClose после прикрепления
 * в режиме модалки, поэтому onClose проброшен на закрытие окна.
 * @param props - Свойства контейнера (состояние окна + контекст проекта + цель прикрепления)
 * @returns JSX элемент модалки с панелью в режиме `modal`
 */
export function FileStorageModal({
  open,
  onOpenChange,
  projectId,
  selectedTokenId,
  onSelectToken,
  allProjects,
  onProjectChange,
  attachTarget,
  onAttach,
  allSheets,
}: FileStorageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Компактное окно: ширина max-w-4xl, высота max-h-[85vh], без внутренних
        отступов и зазоров (p-0 gap-0), чтобы панель заполняла окно целиком.
        DialogContent даёт границы и кнопку закрытия (Req 1.4).
      */}
      <DialogContent
        className="max-w-4xl w-[calc(100%-2rem)] max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col"
        aria-describedby={undefined}
        data-testid="file-storage-modal"
      >
        {/* Заголовок для доступности: видимый текст уже есть в шапке панели (Req 1.3) */}
        <DialogHeader className="sr-only">
          <DialogTitle>Файлы</DialogTitle>
        </DialogHeader>

        <FileStoragePanel
          mode="modal"
          projectId={projectId}
          selectedTokenId={selectedTokenId}
          onSelectToken={onSelectToken}
          allProjects={allProjects}
          onProjectChange={onProjectChange}
          attachTarget={attachTarget}
          onAttach={onAttach}
          allSheets={allSheets}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
