/**
 * @fileoverview Единая кнопка выбора/загрузки медиафайла в свойствах ноды
 * (`MediaFieldButton`). Заменяет прежние кнопки `📁` и отдельный диалог
 * «Управление медиафайлами»: открывает `FileStorageModal` с целью прикрепления
 * `attachTarget` для текущей ноды и пишет результат в единый формат
 * `attachedMedia` через колбэк `onAttach` (Req 2.1, 2.3, 2.4, 2.6).
 * @module components/editor/properties/media/media-field-button
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FolderOpen } from 'lucide-react';
import { FileStorageModal } from '../../files/containers/file-storage-modal';
import type { AttachTarget } from '../../files/panel/panel-types';

/** Контекст проекта/токенов для модалки файлового хранилища */
export interface MediaFieldProjectContext {
  /** Список проектов для переключателя внутри модалки */
  allProjects: Array<{ id: number; name: string }>;
  /** Выбранный токен бота (для приоритизации file_id) */
  selectedTokenId: number | null;
  /** Смена токена */
  onSelectToken: (id: number | null) => void;
  /** Смена проекта */
  onProjectChange: (id: number) => void;
}

/** Пропсы единой кнопки выбора медиа в свойствах ноды */
export interface MediaFieldButtonProps {
  /** ID проекта */
  projectId: number;
  /** ID ноды (для плашки прикрепления) */
  nodeId: string;
  /** Имя ноды (для отображаемой метки цели) */
  nodeName: string;
  /** Поле записи результата — единый формат attachedMedia */
  field: AttachTarget['field'];
  /** Множественный выбор (для attachedMedia всегда true) */
  multi: boolean;
  /** Колбэк прикрепления: пишет выбранные ссылки в данные ноды */
  onAttach: (fileRefs: string[]) => void;
  /**
   * Контекст проекта/токенов для модалки. Если не передан — используется
   * минимальный контекст с текущим проектом (полная проброска — TODO task 9.5).
   */
  projectContext?: MediaFieldProjectContext;
  /** Текст кнопки (по умолчанию «Файл из хранилища») */
  label?: string;
  /** Дополнительные CSS-классы кнопки */
  className?: string;
}

/**
 * Единая кнопка выбора/загрузки файла: владеет локальным состоянием открытия
 * и рендерит `FileStorageModal` с целью прикрепления к текущей ноде. После
 * прикрепления вызывает `onAttach` и закрывает модалку.
 * @param props - Свойства кнопки (проект, нода, поле, колбэк прикрепления)
 * @returns JSX элемент кнопки и связанной модалки хранилища
 */
export function MediaFieldButton({
  projectId,
  nodeId,
  nodeName,
  field,
  multi,
  onAttach,
  projectContext,
  label = 'Файл из хранилища',
  className,
}: MediaFieldButtonProps) {
  /** Состояние открытия модалки файлового хранилища */
  const [open, setOpen] = useState(false);

  /**
   * Контекст проекта: реальный из пропсов либо минимальный дефолт.
   * TODO(task 9.5): пробросить allProjects/токены из редактора для полноценного
   * переключения проекта и приоритизации file_id внутри модалки.
   */
  const ctx: MediaFieldProjectContext = projectContext ?? {
    allProjects: [{ id: projectId, name: `Проект ${projectId}` }],
    selectedTokenId: null,
    onSelectToken: () => {},
    onProjectChange: () => {},
  };

  /** Цель прикрепления для текущей ноды (единый формат attachedMedia) */
  const attachTarget: AttachTarget = {
    nodeId,
    nodeLabel: (nodeName || nodeId).slice(0, 30),
    field,
    multi,
  };

  /**
   * Обработчик прикрепления из модалки: пишет ссылки в ноду и закрывает окно.
   * @param fileRefs - Выбранные ссылки/идентификаторы файлов
   */
  const handleAttach = (fileRefs: string[]) => {
    onAttach(fileRefs);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className ?? 'h-auto min-h-[2.5rem] sm:h-11 gap-1.5'}
        onClick={() => setOpen(true)}
        title="Выбрать файл из хранилища"
      >
        <FolderOpen className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </Button>

      <FileStorageModal
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        selectedTokenId={ctx.selectedTokenId}
        onSelectToken={ctx.onSelectToken}
        allProjects={ctx.allProjects}
        onProjectChange={ctx.onProjectChange}
        attachTarget={attachTarget}
        onAttach={handleAttach}
      />
    </>
  );
}
