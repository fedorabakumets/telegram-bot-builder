/**
 * @fileoverview Пояснение для ноды «Сохранить ответ» — что именно попадает в переменную.
 * @module components/editor/properties/components/input/save-answer-storage-hint
 */

/** Типы источника ответа с отдельным текстом подсказки */
type SaveAnswerHintInputType =
  | 'any'
  | 'text'
  | 'photo'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'contact'
  | 'callback'
  | string;

/** Медиа-типы, для которых сохраняется Telegram file_id, а не файл на диске */
const FILE_ID_MEDIA_TYPES = new Set(['photo', 'video', 'audio', 'document']);

/**
 * Возвращает текст подсказки о сохранении ответа для выбранного типа ввода.
 * @param inputType - Источник ответа из настроек input-ноды
 * @returns Краткое пояснение для панели свойств
 */
export function getSaveAnswerStorageHint(inputType: SaveAnswerHintInputType): string {
  if (inputType === 'text') {
    return 'Текст сообщения сохраняется в переменную как строка. Режим «Добавить» дописывает к уже существующему значению.';
  }

  if (inputType === 'callback') {
    return 'Сохраняется текст нажатой inline-кнопки (или callback_data, если подпись не найдена).';
  }

  if (inputType === 'location') {
    return 'В переменную попадает объект с latitude и longitude — координаты точки на карте.';
  }

  if (inputType === 'contact') {
    return 'В переменную попадает объект с телефоном, именем и другими полями контакта Telegram.';
  }

  if (inputType === 'any') {
    return (
      'Ответ сохраняется в переменную: текст — строкой, медиа — объектом с Telegram file_id. ' +
      'Сами файлы на диск по умолчанию не скачиваются; для повторной отправки подставьте {переменную} в нужных нодах. ' +
      'Скачивание входящих фото на диск — отдельная настройка бота «Сохранять входящие медиа» (вкладка «Бот»): папка uploads/{id проекта}/ГГГГ-ММ-ДД/.'
    );
  }

  if (FILE_ID_MEDIA_TYPES.has(inputType)) {
    const mediaLabel =
      inputType === 'photo'
        ? 'фото'
        : inputType === 'video'
          ? 'видео'
          : inputType === 'audio'
            ? 'аудио'
            : 'документ';

    return (
      `В переменную записывается объект с Telegram file_id (поле value) — по нему бот может снова отправить ${mediaLabel}. ` +
      `${mediaLabel.charAt(0).toUpperCase()}${mediaLabel.slice(1)} на диск по умолчанию не скачивается. ` +
      `Повторно отправить: подставьте {переменную} в нужных нодах. ` +
      `Чтобы сохранять файлы на сервер (uploads/{id проекта}/ГГГГ-ММ-ДД/), включите у бота «Сохранять входящие медиа» (вкладка «Бот»).`
    );
  }

  return 'Нода сохраняет полученный ответ в переменную и позволяет выбрать следующий узел.';
}

/** Пропсы блока подсказки о сохранении ответа */
interface SaveAnswerStorageHintProps {
  /** Тип источника ответа */
  inputType: SaveAnswerHintInputType;
}

/**
 * Блок подсказки под заголовком панели «Сохранение ответа».
 * @param props - Тип ввода для контекстного текста
 * @returns JSX элемент с пояснением
 */
export function SaveAnswerStorageHint({ inputType }: SaveAnswerStorageHintProps) {
  return (
    <p className="text-xs leading-relaxed text-cyan-600/90 dark:text-cyan-400/90">
      {getSaveAnswerStorageHint(inputType)}
    </p>
  );
}
