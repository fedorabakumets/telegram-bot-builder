/**
 * @fileoverview Компонент выбора источника ID для рассылки
 * Позволяет выбрать откуда брать пользователей для рассылки
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComingSoonBadge } from '../conditional-message-card/coming-soon-badge';

/**
 * Типы источников ID пользователей
 */
export type IdSourceType = 'user_ids' | 'bot_users' | 'both';

/**
 * Свойства компонента выбора источника ID
 */
interface IdSourceSelectorProps {
  /** Данные узла для редактирования */
  node: Node;
  /** Колбэк для обновления данных узла */
  onUpdate: (nodeId: string, data: Partial<Node['data']>) => void;
}

/**
 * Компонент выбора источника ID для рассылки
 * @param props - Свойства компонента
 * @returns JSX элемент селектора
 */
export function IdSourceSelector({ node, onUpdate }: IdSourceSelectorProps) {
  const sourceType = (node.data.idSourceType as IdSourceType) || 'bot_users';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="idSourceType">Источник пользователей</Label>
        <ComingSoonBadge />
      </div>
      <Select
        value={sourceType}
        onValueChange={(value: IdSourceType) =>
          onUpdate(node.id, { idSourceType: value })
        }
      >
        <SelectTrigger id="idSourceType" className="w-full">
          <SelectValue placeholder="Выберите источник" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bot_users">
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span>Все пользователи бота (bot_users)</span>
            </div>
          </SelectItem>
          <SelectItem value="user_ids">
            <div className="flex items-center gap-2">
              <span>📋</span>
              <span>Ручной список (user_ids)</span>
            </div>
          </SelectItem>
          <SelectItem value="both">
            <div className="flex items-center gap-2">
              <span>🔄</span>
              <span>Обе таблицы</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {sourceType === 'bot_users' && '📊 Рассылка всем, кто когда-либо писал боту'}
        {sourceType === 'user_ids' && '📊 Рассылка по вручную добавленному списку'}
        {sourceType === 'both' && '📊 Рассылка по всем доступным источникам'}
      </p>
    </div>
  );
}
