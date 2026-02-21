/**
 * @fileoverview Компонент выбора типа API для рассылки
 *
 * Позволяет выбрать метод отправки сообщений:
 * - Bot API: стандартный метод через бота (ограничения Telegram)
 * - Client API: через личный аккаунт (требует авторизации во вкладке Telegram Client)
 *
 * @module ApiTypeSelector
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
import { Badge } from '@/components/ui/badge';

/**
 * Пропсы компонента выбора типа API
 */
interface ApiTypeSelectorProps {
  /** Данные узла рассылки */
  node: Node;
  /** Функция обновления данных узла */
  onUpdate: (nodeId: string, data: Partial<Node['data']>) => void;
}

/**
 * Компонент выбора типа API для рассылки
 *
 * @param {ApiTypeSelectorProps} props - Пропсы компонента
 * @returns {JSX.Element} Селектор типа API
 */
export function ApiTypeSelector({ node, onUpdate }: ApiTypeSelectorProps) {
  const apiType = node.data.broadcastApiType || 'bot';

  return (
    <div className="space-y-2">
      <Label htmlFor="apiType" className="text-sm font-medium">
        Метод отправки
      </Label>
      <Select
        value={apiType}
        onValueChange={(value: "bot" | "client") => onUpdate(node.id, { broadcastApiType: value })}
      >
        <SelectTrigger id="apiType" className="w-full">
          <SelectValue placeholder="Выберите метод" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bot">
            <div className="flex items-center gap-2">
              <span>🤖</span>
              <span>Bot API (стандарт)</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                Только писавшие боту
              </Badge>
            </div>
          </SelectItem>
          <SelectItem value="client">
            <div className="flex items-center gap-2">
              <span>👤</span>
              <span>Client API (Userbot)</span>
              <Badge variant="outline" className="ml-auto text-xs">
                Требует авторизации
              </Badge>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      {apiType === 'client' && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          ⚠️ Требуется авторизация во вкладке{" "}
          <Badge variant="outline" className="text-xs">Telegram Client</Badge>
        </p>
      )}
    </div>
  );
}
