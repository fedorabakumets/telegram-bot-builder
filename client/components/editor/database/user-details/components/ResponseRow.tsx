/**
 * @fileoverview Компонент строки ответа
 * @description Отображает одну строку таблицы с ответом пользователя
 */

import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { ResponseData, getAnswerValue, parseResponseData } from '../utils/parseResponseData';
import { ResponseCell } from './ResponseCell';
import { ResponseTypeBadge } from './ResponseTypeBadge';

/**
 * @interface ResponseRowProps
 * @description Свойства строки ответа
 */
interface ResponseRowProps {
  /** Ключ переменной */
  variableKey: string;
  /** Сырое значение ответа */
  rawValue: unknown;
}

/**
 * Компонент строки таблицы ответов
 * @param {ResponseRowProps} props - Свойства компонента
 * @returns {JSX.Element} Элемент строки
 */
export function ResponseRow({ variableKey, rawValue }: ResponseRowProps): React.JSX.Element {
  const responseData = parseResponseData(rawValue);
  const answerValue = getAnswerValue(responseData, rawValue);

  // Форматируем имя переменной
  const displayName = variableKey.startsWith('response_')
    ? variableKey.replace('response_', 'Ответ ')
    : variableKey;

  return (
    <TableRow>
      <TableCell className="align-top min-w-[80px] max-w-[120px]">
        <div className="font-medium text-[10px] sm:text-sm break-words line-clamp-2">{displayName}</div>
      </TableCell>
      <TableCell className="align-top min-w-[100px] max-w-none">
        <ResponseCell responseData={responseData} answerValue={answerValue} />
      </TableCell>
      <TableCell className="align-top min-w-[60px]">
        <ResponseTypeBadge type={responseData?.type} />
      </TableCell>
    </TableRow>
  );
}
