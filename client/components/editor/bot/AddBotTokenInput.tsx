/**
 * @fileoverview Поле ввода токена бота
 *
 * Компонент отображает поле для ввода токена с индикаторами статуса.
 *
 * @module AddBotTokenInput
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddBotTokenInputProps {
  newBotToken: string;
  setNewBotToken: (token: string) => void;
  isParsingBot: boolean;
  createBotMutation: any;
  projectForNewBot: number | null;
}

/**
 * Поле ввода токена бота
 */
export function AddBotTokenInput({
  newBotToken,
  setNewBotToken,
  isParsingBot,
  createBotMutation,
  projectForNewBot
}: AddBotTokenInputProps) {
  const isDisabled = isParsingBot || createBotMutation.isPending || !projectForNewBot;

  return (
    <div className="space-y-2">
      <Label htmlFor="bot-token" className="text-sm sm:text-base font-semibold">
        Токен бота
      </Label>
      <div className="relative">
        <Input
          id="bot-token"
          type="password"
          placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
          value={newBotToken}
          onChange={(e) => setNewBotToken(e.target.value)}
          disabled={isDisabled}
          className="text-xs sm:text-sm pr-10"
          data-testid="input-bot-token"
        />
        {newBotToken && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
      {isParsingBot && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800/50">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-spin" />
          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">
            Проверяем токен и получаем информацию о боте...
          </p>
        </div>
      )}
    </div>
  );
}
