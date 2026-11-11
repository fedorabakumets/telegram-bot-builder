/**
 * @fileoverview Спокойная карточка вопроса и ответа пользователя.
 */
import { VariableToQuestionMap } from '../../types';
import { ResponseData } from '../../types';
import { formatDate } from '../../../utils';
import { ResponseMedia } from './response-media';

/** Свойства карточки ответа. */
interface ResponseCardProps {
  /** Ключ переменной. */
  keyName: string;
  /** Сохранённое значение. */
  value: unknown;
  /** Соответствие переменных вопросам. */
  variableToQuestionMap: VariableToQuestionMap;
  /** Поиск фотографии в истории. */
  getPhotoUrlFromMessages: (fileId: string) => string | null;
}

/** Читает структурированный ответ, сохраняя обычный текст без изменений. */
function parseResponse(value: unknown): ResponseData {
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch { return { value, type: 'text' }; }
  }
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as ResponseData : { value: String(parsed ?? '') };
}

/** Отображает вопрос, ответ и метаданные без декоративных цветовых сигналов. */
export function ResponseCard({ keyName, value, variableToQuestionMap, getPhotoUrlFromMessages }: ResponseCardProps): React.JSX.Element {
  const data = parseResponse(value);
  const answer = data.value !== undefined ? String(data.value) : typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
  const question = variableToQuestionMap[keyName] || data.prompt?.trim() || keyName;
  const types: Record<string, string> = { text: 'Текст', number: 'Число', email: 'Email', phone: 'Телефон', photo: 'Фото', image: 'Фото', audio: 'Аудио', video: 'Видео', document: 'Документ' };
  const hasMedia = Boolean(data.media?.length || data.photoUrl || ['photo', 'image', 'audio', 'video', 'document'].includes(data.type || ''));
  return (
    <article className="min-w-0 rounded-xl border border-border/60 bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="break-all">{keyName.startsWith('response_') ? keyName.replace('response_', 'Ответ ') : keyName}</span>
        <div className="flex flex-wrap items-center gap-3">
          {data.type && <span>{types[data.type] || data.type}</span>}
          {data.timestamp && <span className="tabular-nums">{String(formatDate(data.timestamp))}</span>}
        </div>
      </div>
      {question !== keyName && <p className="mb-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">{String(question)}</p>}
      <div className="min-w-0 space-y-3">
        <ResponseMedia responseData={data} answerValue={answer} getPhotoUrlFromMessages={getPhotoUrlFromMessages} />
        {!hasMedia && <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{answer || 'Ответ не заполнен'}</p>}
      </div>
      {data.nodeId != null && <p className="mt-3 break-all border-t border-border/50 pt-3 text-xs text-muted-foreground">Узел: {String(data.nodeId)}</p>}
    </article>
  );
}
