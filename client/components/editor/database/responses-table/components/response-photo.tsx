/**
 * @fileoverview Отображение вложений ответа без бесконечных состояний загрузки.
 */
import type { ResponseData } from '../types';
import { ResponseMediaItem } from './response-media-item';
import { FileNotFound } from './file-not-found';

/** Свойства вложений ответа. */
interface ResponsePhotoProps {
  /** Данные ответа. */
  responseData: ResponseData;
  /** Текстовое значение или адрес вложения. */
  answerValue: string;
  /** Поиск адреса по идентификатору Telegram. */
  getPhotoUrlFromMessages: (fileId: string) => string | null;
}
/**
 * Проверяет поддерживаемый адрес вложения.
 * @param value - Проверяемая строка.
 * @returns Признак доступного протокола.
 */
function isMediaUrl(value: string): boolean {
  return /^(https?:\/\/|\/(?!\/))/.test(value);
}
/**
 * Показывает каждое вложение независимо или сообщает о недоступности файла.
 * @param props - Данные ответа и поиск вложений Telegram.
 * @returns Содержимое ответа.
 */
export function ResponsePhoto({ responseData, answerValue, getPhotoUrlFromMessages }: ResponsePhotoProps): React.JSX.Element {
  if (Array.isArray(responseData?.media) && responseData.media.length > 0) {
    return <div className="space-y-2 max-w-sm">{responseData.media.map((media, index) => {
      const item = typeof media === 'string' ? { url: media } : media;
      const url = item?.url || '';
      return isMediaUrl(url) ? <ResponseMediaItem key={`${url}-${index}`} url={url} type="photo" /> : <FileNotFound key={index} />;
    })}</div>;
  }
  const candidate = responseData?.photoUrl || answerValue || '';
  const url = isMediaUrl(candidate) ? candidate : getPhotoUrlFromMessages(candidate);
  if (!url) return <FileNotFound />;
  return <ResponseMediaItem url={url} type={responseData?.photoUrl ? 'photo' : responseData?.type} />;
}
