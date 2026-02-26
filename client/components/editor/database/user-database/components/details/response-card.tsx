/**
 * @fileoverview Компонент карточки ответа пользователя
 * @description Отображает вопрос и ответ пользователя
 */

import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, MessageSquare } from 'lucide-react';
import { VariableToQuestionMap } from '../../types';
import { formatDate } from '../../../utils';
import { ResponseMedia } from './response-media';

/**
 * Пропсы компонента ResponseCard
 */
interface ResponseCardProps {
  /** Ключ ответа */
  keyName: string;
  /** Значение ответа */
  value: unknown;
  /** Карта вопросов */
  variableToQuestionMap: VariableToQuestionMap;
  /** Функция поиска URL фото */
  getPhotoUrlFromMessages: (fileId: string) => string | null;
}

/**
 * Компонент карточки ответа
 * @param props - Пропсы компонента
 * @returns JSX компонент карточки
 */
export function ResponseCard({
  keyName,
  value,
  variableToQuestionMap,
  getPhotoUrlFromMessages,
}: ResponseCardProps): React.JSX.Element {
  // Парсинг ответа
  let responseData: any = value;
  if (typeof value === 'string') {
    try {
      responseData = JSON.parse(value);
    } catch {
      responseData = { value: value, type: 'text' };
    }
  }

  const answerValue =
    responseData?.value !== undefined
      ? responseData.value
      : typeof value === 'object' && value !== null
      ? JSON.stringify(value)
      : String(value);

  // Получение текста вопроса
  const getQuestionText = (questionKey: string, data: any) => {
    if (variableToQuestionMap[questionKey]) {
      return variableToQuestionMap[questionKey];
    }
    if (data?.prompt && data.prompt.trim()) {
      return data.prompt;
    }
    return questionKey;
  };

  const questionText = getQuestionText(keyName, responseData);

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-br from-muted/30 to-muted/60 hover:from-muted/50 hover:to-muted/80 transition-all duration-200 shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
            <span className="text-sm font-medium text-foreground">
              {String(keyName.startsWith('response_') ? keyName.replace('response_', 'Ответ ') : keyName)}
            </span>
          </div>
          {responseData?.type && (
            <Badge variant="outline" className="text-xs border-primary/20 text-primary">
              {String(
                responseData.type === 'text'
                  ? 'Текст'
                  : responseData.type === 'number'
                  ? 'Число'
                  : responseData.type === 'email'
                  ? 'Email'
                  : responseData.type === 'phone'
                  ? 'Телефон'
                  : responseData.type
              )}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">
            {String(responseData?.timestamp ? formatDate(responseData.timestamp) : 'Недавно')}
          </span>
        </div>
      </div>

      <div className="bg-background rounded-lg p-4 border border-border shadow-sm">
        {/* Вопрос */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-100">Вопрос:</span>
          </div>
          <div className="text-blue-800 dark:text-blue-200 leading-relaxed">
            {String(questionText)}
          </div>
        </div>

        {/* Ответ */}
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Edit className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-900 dark:text-green-100">Ответ:</span>
          </div>

          <ResponseMedia
            responseData={responseData}
            answerValue={String(answerValue)}
            getPhotoUrlFromMessages={getPhotoUrlFromMessages}
          />

          {!responseData?.media && !responseData?.photoUrl && !(responseData?.type === 'photo' || responseData?.type === 'image') && !String(answerValue).startsWith('/uploads/') && (
            <div className="text-green-800 dark:text-green-200 leading-relaxed font-medium">
              {String(answerValue)}
            </div>
          )}
        </div>

        {/* ID узла */}
        {responseData?.nodeId && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full" />
              ID узла: {String(responseData.nodeId)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
