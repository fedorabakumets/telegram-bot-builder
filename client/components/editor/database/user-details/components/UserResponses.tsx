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
      <div className="space-y-2 xs:space-y-2.5 sm:space-y-3 w-full">
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2">
          <MessageSquare className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
          <Label className="text-xs xs:text-sm font-semibold truncate w-full">Ответы пользователя</Label>
          <Badge variant="secondary" className="text-[10px] xs:text-xs sm:text-xs flex-shrink-0">
            {totalCount}
          </Badge>
        </div>
        <div className="pl-4 xs:pl-5 sm:pl-6 w-full">
          {totalCount > 48 && (
            <div className="text-[10px] xs:text-xs sm:text-xs text-muted-foreground mb-2">
              Отображены первые 48 из {totalCount}
            </div>
          )}
          <div className="rounded-md border overflow-hidden w-full">
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[320px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-1/3 min-w-[80px] font-semibold text-[10px] xs:text-[10px] sm:text-xs whitespace-nowrap">Переменная</TableHead>
                    <TableHead className="w-1/3 min-w-[100px] font-semibold text-[10px] xs:text-[10px] sm:text-xs whitespace-nowrap">Ответ</TableHead>
                    <TableHead className="w-1/3 min-w-[60px] font-semibold text-[10px] xs:text-[10px] sm:text-xs whitespace-nowrap">Тип</TableHead>
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
      </div>
    </>
  );
}
