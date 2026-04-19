/**
 * @fileoverview Селектор токена бота для вкладки базы данных пользователей
 */

import { BotToken } from '@shared/schema';
import { Bot } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  if (token.botFirstName) {
    return token.botFirstName;
  }

  if (token.botUsername) {
    return `@${token.botUsername}`;
  }

  return token.name || `Бот #${token.id}`;
}

/**
 * Отображает выбор бота для будущей сегментации базы пользователей
 * @param props - Пропсы компонента
 * @returns JSX элемент селектора токенов
 */
export function BotTokenSelector({
  tokens,
  selectedTokenId,
  onSelect,
}: BotTokenSelectorProps): React.JSX.Element {
  if (tokens.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        У проекта пока нет добавленных ботов для выбора.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
        <Bot className="h-4 w-4 text-cyan-600" />
        Бот для просмотра базы
      </div>
      <Select
        value={selectedTokenId ? String(selectedTokenId) : undefined}
        onValueChange={(value) => onSelect(Number(value))}
      >
        <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background">
          <SelectValue placeholder="Выберите бота" />
        </SelectTrigger>
        <SelectContent>
          {tokens.map((token) => (
            <SelectItem key={token.id} value={String(token.id)}>
              {getTokenLabel(token)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-2 text-xs text-muted-foreground">
        Интерфейс выбора уже подготовлен. Разделение данных по выбранному боту подключим на следующем шаге.
      </p>
    </div>
  );
}
