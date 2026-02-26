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
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { ResponseRow } from './ResponseRow';

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
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <Label className="text-xs sm:text-sm font-semibold">Ответы пользователя</Label>
          <Badge variant="secondary" className="text-[10px] sm:text-xs">
            {totalCount}
          </Badge>
        </div>
        <div className="pl-5 sm:pl-6">
          {totalCount > 48 && (
            <div className="text-[10px] sm:text-xs text-muted-foreground mb-2">
              Отображены первые 48 из {totalCount}
            </div>
          )}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-1/3 font-semibold text-[10px] sm:text-xs">Переменная</TableHead>
                  <TableHead className="w-1/3 font-semibold text-[10px] sm:text-xs">Ответ</TableHead>
                  <TableHead className="w-1/3 font-semibold text-[10px] sm:text-xs">Тип</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(([key, value]) => (
                  <ResponseRow key={key} variableKey={key} rawValue={value} />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
