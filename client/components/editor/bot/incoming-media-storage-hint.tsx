/**
 * @fileoverview Пояснение для настройки «Сохранять входящие фото»
 * @module bot/incoming-media-storage-hint
 */

/** Пропсы блока подсказки о сохранении входящих фото */
interface IncomingMediaStorageHintProps {
  /** ID проекта — подставляется в путь uploads/{projectId}/... */
  projectId: number;
  /** Включено ли сохранение входящих фото */
  enabled: boolean;
  /** Дополнительный CSS-класс контейнера */
  className?: string;
}

/**
 * Возвращает шаблон папки для сохранения входящих фото на сервере.
 * @param projectId - ID проекта
 * @returns Путь вида uploads/157/ГГГГ-ММ-ДД/
 */
export function getIncomingPhotoUploadPathPattern(projectId: number): string {
  return `uploads/${projectId}/ГГГГ-ММ-ДД/`;
}

/**
 * Текст подсказки для режима «сохранять фото» (без JSX).
 * @param projectId - ID проекта
 * @returns Однострочное описание пути и назначения
 */
export function getIncomingMediaEnabledHint(projectId: number): string {
  return (
    `Фото скачиваются в ${getIncomingPhotoUploadPathPattern(projectId)}, ` +
    'регистрируются в media_files и отображаются во вкладке «Файлы».'
  );
}

/**
 * Текст подсказки для режима «не сохранять фото».
 * @returns Однострочное описание поведения
 */
export function getIncomingMediaDisabledHint(): string {
  return 'Фото не скачиваются на диск и не попадают во вкладку «Файлы» — только Telegram file_id в переменных сценария.';
}

/**
 * Подсказка под переключателем «Сохранять входящие фото» с путём на сервере.
 * @param props - ID проекта и состояние переключателя
 * @returns JSX элемент с пояснением
 */
export function IncomingMediaStorageHint({
  projectId,
  enabled,
  className = 'text-xs text-muted-foreground/70 mt-0.5 leading-relaxed',
}: IncomingMediaStorageHintProps) {
  if (!enabled) {
    return <p className={className}>{getIncomingMediaDisabledHint()}</p>;
  }

  const uploadPath = getIncomingPhotoUploadPathPattern(projectId);

  return (
    <p className={className}>
      Фото скачиваются в{' '}
      <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[11px]">{uploadPath}</code>, регистрируются в{' '}
      <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[11px]">media_files</code> и отображаются во вкладке «Файлы».
    </p>
  );
}
