/**
 * @fileoverview Галочка «Отправить как гиф» у видео в карточке медиафайла.
 */

/** Пропсы галочки отправки видео как GIF */
interface SendAsGifToggleProps {
  /** Включена ли отправка этого файла как GIF */
  checked: boolean;
  /** Новое состояние галочки */
  onChange: (enabled: boolean) => void;
}

/**
 * Показывает галочку только для видео: mp4, webm, mov и похожие.
 * Файл .gif галочку не получает — он и так уходит как анимация.
 * @param fileType - Тип файла в карточке
 * @param url - URL или путь файла
 * @returns true, если галочку нужно показать
 */
export function showSendAsGifToggle(fileType: string, url: string): boolean {
  if (url.toLowerCase().includes('.gif')) return false;
  return fileType === 'video';
}

/**
 * Галочка «Отправить как гиф» для одного видеофайла.
 * @param props - Состояние и обработчик
 * @returns Подпись с чекбоксом
 */
export function SendAsGifToggle({ checked, onChange }: SendAsGifToggleProps) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
      <input
        type="checkbox"
        className="h-3.5 w-3.5 rounded border-slate-300"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      Отправить как гиф
    </label>
  );
}
