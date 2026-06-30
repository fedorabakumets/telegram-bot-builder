/**
 * @fileoverview Общие типы переиспользуемой панели файлового хранилища
 * (`FileStoragePanel`): режим отображения, цель прикрепления к ноде и
 * пропсы панели. Единый источник истины для страницы и модалки (Req 1.1, 1.2, 1.6).
 * @module components/editor/files/panel/panel-types
 */

/** Режим отображения панели: полноэкранная страница или модалка */
export type PanelMode = 'page' | 'modal';

/** Лист проекта с нодами (для столбца «используется в нодах» и перехода к ноде) */
export interface SheetInfo {
  /** ID листа */
  id: string;
  /** Имя листа */
  name: string;
  /** Массив нод листа */
  nodes: Array<{ id: string; data: Record<string, any> }>;
}

/** Цель прикрепления файла к ноде */
export interface AttachTarget {
  /** ID целевой ноды */
  nodeId: string;
  /** Отображаемое имя ноды */
  nodeLabel: string;
  /**
   * Поле записи. Единый формат — массив attachedMedia.
   * Легаси одиночные поля (imageUrl/videoUrl/audioUrl/documentUrl) НЕ используются:
   * всё прикрепление унифицировано на attachedMedia.
   */
  field: 'attachedMedia';
  /** true = можно прикрепить несколько файлов (для attachedMedia всегда true) */
  multi: boolean;
}

/** Пропсы переиспользуемой панели хранилища */
export interface FileStoragePanelProps {
  /** Режим: страница или модалка */
  mode: PanelMode;
  /** ID проекта */
  projectId: number;
  /** Выбранный токен бота (для приоритезации file_id) */
  selectedTokenId?: number | null;
  /** Смена токена */
  onSelectToken: (tokenId: number | null) => void;
  /** Список проектов для переключателя */
  allProjects: Array<{ id: number; name: string }>;
  /** Смена проекта */
  onProjectChange: (projectId: number) => void;
  /** Цель прикрепления (только mode='modal' или режим прикрепления на странице) */
  attachTarget?: AttachTarget | null;
  /** Прикрепить выбранные файлы к ноде */
  onAttach?: (fileRefs: string[]) => void;
  /** Все листы (для колонки «используется в нодах» и перехода к ноде) */
  allSheets?: SheetInfo[];
  /** Переход к ноде на холсте (только mode='page') */
  onGoToNode?: (nodeId: string, sheetId: string) => void;
  /** Закрытие модалки (только mode='modal') */
  onClose?: () => void;
}
