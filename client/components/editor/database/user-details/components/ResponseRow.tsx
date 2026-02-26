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
    <TableRow className="hover:bg-muted/50 border-b border-border/30">
      <TableCell className="align-top min-w-[70px] max-w-[100px] py-1.5 xs:py-2 sm:py-2.5 px-2 xs:px-2.5 sm:px-3">
        <div className="font-medium text-[9px] xs:text-[10px] sm:text-xs break-words line-clamp-2 leading-tight">{displayName}</div>
      </TableCell>
      <TableCell className="align-top min-w-[90px] py-1.5 xs:py-2 sm:py-2.5 px-2 xs:px-2.5 sm:px-3">
        <ResponseCell responseData={responseData} answerValue={answerValue} />
      </TableCell>
      <TableCell className="align-top min-w-[50px] py-1.5 xs:py-2 sm:py-2.5 px-2 xs:px-2.5 sm:px-3">
        <ResponseTypeBadge type={responseData?.type} />
      </TableCell>
    </TableRow>
  );
}
