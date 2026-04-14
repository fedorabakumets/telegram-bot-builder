/**
 * @fileoverview Состояние отсутствия ботов
 *
 * Компонент отображается, когда в проекте нет подключенных ботов.
 *
 * @module EmptyBotsState
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Plus } from 'lucide-react';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { isGuest } from '@/types/telegram-user';

interface EmptyBotsStateProps {
  onAddBot: () => void;
}

/**
 * Состояние отсутствия ботов в проекте
 */
export function EmptyBotsState({ onAddBot }: EmptyBotsStateProps) {
  const { user } = useTelegramAuth();
  const isGuestUser = !user || isGuest(user);

  return (
    <Card className="border-2 border-dashed border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-8 px-4">
        <Bot className="w-10 h-10 text-muted-foreground mb-2" />
        <h4 className="font-medium text-foreground mb-1">Нет подключенных ботов</h4>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {isGuestUser ? 'Войдите через Telegram чтобы добавить бота' : 'Добавьте бота к этому проекту'}
        </p>
        {!isGuestUser && (
          <Button
            onClick={onAddBot}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Добавить бота
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
