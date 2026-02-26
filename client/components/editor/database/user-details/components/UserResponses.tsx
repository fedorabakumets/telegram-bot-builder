/**
 * @fileoverview Компонент ответов пользователя
 * @description Отображает таблицу с ответами пользователя на вопросы
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { UserBotData } from '@shared/schema';

/**
 * @interface UserResponsesProps
 * @description Свойства компонента ответов
 */
interface UserResponsesProps {
  /** Данные пользователя */
  user: UserBotData;
}

/**
 * Компонент ответов пользователя
 * @param {UserResponsesProps} props - Свойства компонента
 * @returns {JSX.Element | null} Таблица ответов или null
 */
export function UserResponses({ user }: UserResponsesProps): React.JSX.Element | null {
  if (!user.userData || typeof user.userData !== 'object' || Object.keys(user.userData as Record<string, unknown>).length === 0) {
    return null;
  }

  const entries = Object.entries(user.userData as Record<string, unknown>).slice(0, 48);
  const totalCount = Object.keys(user.userData as Record<string, unknown>).length;

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Ответы пользователя</Label>
          <Badge variant="secondary" className="text-xs">
            {totalCount}
          </Badge>
        </div>
        <div className="pl-6">
          {totalCount > 48 && (
            <div className="text-xs text-muted-foreground mb-2">
              Отображены первые 48 ответов из {totalCount}
            </div>
          )}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-1/3 font-semibold">Переменная</TableHead>
                  <TableHead className="w-1/3 font-semibold">Ответ</TableHead>
                  <TableHead className="w-1/3 font-semibold">Тип</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(([key, value]: [string, unknown]) => {
                  let responseData: any = value;
                  if (typeof value === 'string') {
                    try {
                      responseData = JSON.parse(value);
                    } catch {
                      responseData = { value, type: 'text' };
                    }
                  } else if (typeof value === 'object' && value !== null) {
                    responseData = value;
                  } else {
                    responseData = { value: String(value), type: 'text' };
                  }

                  const answerValue = String(
                    responseData?.value !== undefined
                      ? responseData.value
                      : typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : String(value)
                  );

                  return (
                    <TableRow key={key}>
                      <TableCell className="align-top">
                        <div className="font-medium text-sm">
                          {key.startsWith('response_') ? key.replace('response_', 'Ответ ') : key}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {(() => {
                          if (responseData?.photoUrl) {
                            return (
                              <div className="rounded-lg overflow-hidden max-w-[150px]">
                                <img
                                  src={responseData.photoUrl}
                                  alt="Фото ответ"
                                  className="w-full h-auto rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            );
                          }

                          if (responseData?.media && Array.isArray(responseData.media) && responseData.media.length > 0) {
                            return (
                              <div className="rounded-lg overflow-hidden max-w-[150px] space-y-1">
                                {responseData.media.map((m: any, idx: number) => (
                                  <img
                                    key={idx}
                                    src={m.url || m}
                                    alt="Ответ фото"
                                    className="w-full h-auto rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ))}
                              </div>
                            );
                          }

                          const valueStr = String(answerValue);
                          const isImageUrl = valueStr.startsWith('http://') || valueStr.startsWith('https://') || valueStr.startsWith('/uploads/');

                          if (isImageUrl) {
                            return (
                              <div className="rounded-lg overflow-hidden max-w-[150px]">
                                <img
                                  src={valueStr}
                                  alt="Ответ"
                                  className="w-full h-auto rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            );
                          }

                          return (
                            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                              {valueStr}
                            </p>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="align-top">
                        {responseData?.type && (
                          <Badge variant="outline" className="text-xs">
                            {responseData.type === 'text' ? 'Текст' :
                              responseData.type === 'number' ? 'Число' :
                                responseData.type === 'email' ? 'Email' :
                                  responseData.type === 'phone' ? 'Телефон' :
                                    String(responseData.type)}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
