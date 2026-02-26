/**
 * @fileoverview Компонент raw JSON данных пользователя
 * @description Отображает все данные пользователя в формате JSON
 */

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Hash } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserBotData } from '@shared/schema';
import { CopyJsonButton } from './copy-json-button';

/**
 * @interface RawJsonProps
 * @description Свойства компонента JSON
 */
interface RawJsonProps {
  /** Данные пользователя */
  user: UserBotData;
}

/**
 * Компонент raw JSON
 * @param {RawJsonProps} props - Свойства компонента
 * @returns {JSX.Element | null} Секция JSON или null
 */
export function RawJson({ user }: RawJsonProps): React.JSX.Element | null {
  if (!user.userData || typeof user.userData !== 'object' || Object.keys(user.userData as Record<string, unknown>).length === 0) {
    return null;
  }

  return (
    <>
      <Separator />
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <Label className="text-xs sm:text-sm font-semibold">Все данные (JSON)</Label>
          <CopyJsonButton data={user.userData} />
        </div>
        <div className="pl-5 sm:pl-6 w-full min-w-0">
          <Textarea
            value={JSON.stringify(user.userData, null, 2)}
            readOnly
            rows={12}
            className="text-[10px] sm:text-xs font-mono bg-muted resize-none w-full min-w-0 overflow-auto"
          />
        </div>
      </div>
    </>
  );
}
