/**
 * @fileoverview Компактный inline-селектор токена бота
 * @description Отображает Select с иконкой бота без лишних блоков и описаний
 */

import { BotToken } from '@shared/schema';
import { Bot } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Пропсы селектора токена бота
 */
interface BotTokenSelectorProps {
  /** Список токенов проекта */
  tokens: BotToken[];
  /** Идентификатор выбранного токена */
  selectedTokenId: number | null;
  /** Обработчик выбора токена */
  onSelect: (tokenId: number | null) => void;
}

/**
 * Формирует читаемую подпись токена
 * @param token - Данные токена бота
 * @returns Отображаемое имя токена
 */
function getTokenLabel(token: BotToken): string {
  if (token.botFirstName && token.botUsername) {
    return `${token.botFirstName} (@${token.botUsername})`;
  }
  if (token.botFirstName) return token.botFirstName;
  if (token.botUsername) return `@${token.botUsername}`;
  return token.name || `Бот #${token.id}`;
}

/**
 * Компактный inline-селектор бота для панели базы данных
 * @param props - Пропсы компонента
 * @returns JSX элемент селектора или заглушка при отсутствии ботов
 */
export function BotTokenSelector({
  tokens,
  selectedTokenId,
  onSelect,
}: BotTokenSelectorProps): React.JSX.Element {
  if (tokens.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Bot className="w-3.5 h-3.5" />
        <span>Нет ботов</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Bot className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <Select
        value={selectedTokenId ? String(selectedTokenId) : undefined}
        onValueChange={(value) => onSelect(Number(value))}
      >
        <SelectTrigger className="h-8 text-xs border-border/60 bg-background min-w-[120px] max-w-[180px]">
          <SelectValue placeholder="Бот" />
        </SelectTrigger>
        <SelectContent>
          {tokens.map((token) => (
            <SelectItem key={token.id} value={String(token.id)}>
              {getTokenLabel(token)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
