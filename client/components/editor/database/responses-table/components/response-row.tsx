/**
 * @fileoverview Строка таблицы ответов с нейтральной типографикой и вложениями.
 */
import { TableRow, TableCell } from '@/components/ui/table';
import type { UserBotData } from '@shared/schema';
import { ResponsePhoto } from './response-photo';
import { ResponseMediaItem } from './response-media-item';
import { parseResponseData } from '../utils';
import { FileNotFound } from './file-not-found';

/** Свойства строки ответа. */
interface ResponseRowProps {
  /** Пользователь, приславший ответ. */
  user: UserBotData;
  /** Имя переменной ответа. */
  keyName: string;
  /** Порядковый номер ответа. */
  responseIndex: number;
  /** Исходное значение ответа. */
  value: unknown;
}
/**
 * Показывает имя, переменную и содержимое ответа.
 * @param props - Данные пользователя и ответа.
 * @returns Строка таблицы.
 */
export function ResponseRow({ user, keyName, value }: ResponseRowProps): React.JSX.Element {
  const response = parseResponseData(value);
  const raw = response?.value ?? value;
  const text = typeof raw === 'object' && raw !== null ? JSON.stringify(raw) : String(raw ?? '—');
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || (user.userName ? `@${user.userName}` : `ID: ${user.userId}`);
  const media = /^image_url_/.test(keyName) || response?.media || response?.photoUrl || ['photo', 'image', 'audio', 'video', 'document'].includes(response?.type || '');
  return <TableRow className="border-b border-border/50 hover:bg-muted/30">
    <TableCell className="py-3 align-top min-w-32"><div className="text-sm font-medium break-words">{name}</div><div className="text-xs text-muted-foreground tabular-nums">Telegram ID: {user.userId}</div></TableCell>
    <TableCell className="py-3 align-top"><div className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{keyName.startsWith('response_') ? keyName.replace('response_', 'Ответ ') : keyName}</div></TableCell>
    <TableCell className="py-3 align-top max-w-sm">
      {media ? <ResponsePhoto responseData={/^image_url_/.test(keyName) ? { ...response, type: response?.type || 'photo' } : response} answerValue={text} getPhotoUrlFromMessages={() => null} />
        : /^(https?:\/\/|\/(?!\/))/.test(text) ? <ResponseMediaItem url={text} />
        : !text.trim() ? <FileNotFound /> : <p className="text-sm text-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{text === 'undefined' || text === 'null' ? '—' : text}</p>}
    </TableCell>
  </TableRow>;
}
