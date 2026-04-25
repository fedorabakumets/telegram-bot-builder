/**
 * @fileoverview Пошаговая инструкция по получению данных из BotFather для Telegram Login
 * @module components/editor/setup/SetupInstructions
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Один шаг инструкции
 */
interface Step {
  /** Порядковый номер шага */
  num: number;
  /** Текст шага */
  text: string;
}

/** Шаги инструкции по настройке Telegram Login через BotFather */
const STEPS: Step[] = [
  { num: 1, text: 'Открой мини-приложение @BotFather в Telegram' },
  { num: 2, text: 'My Bots → выбери нужного бота' },
  { num: 3, text: 'Нажми Login Widget (см. скриншот ниже)' },
  { num: 4, text: 'Добавь Allowed URLs — домен сайта (например https://example.com). Без этого логин не работает' },
  { num: 5, text: 'После добавления URL BotFather покажет Client ID и Client Secret — скопируй оба' },
  { num: 6, text: 'Bot Username — имя бота без символа @ (видно в профиле бота)' },
  { num: 7, text: 'Bot Token — опционально, для Mini App. Получи через /token в @BotFather' },
];

/**
 * Компонент пошаговой инструкции по настройке Telegram Login.
 * Отображает карточку с нумерованными шагами и скриншотом BotFather.
 *
 * @returns JSX элемент с инструкцией
 */
export function SetupInstructions() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Как получить данные в BotFather
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {STEPS.slice(0, 3).map(({ num, text }) => (
          <div key={num} className="flex items-start gap-3">
            <Badge
              variant="outline"
              className="h-6 w-6 shrink-0 rounded-full p-0 flex items-center justify-center text-xs font-bold border-primary/40 text-primary"
            >
              {num}
            </Badge>
            <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
          </div>
        ))}

        {/* Скриншот: где найти Login Widget в BotFather — после шага 3 */}
        <div className="py-1">
          <img
            src="/assets/images/botfather-login-widget.png"
            alt="Login Widget в меню BotFather"
            className="w-full rounded-lg border border-border/40 opacity-90"
          />
        </div>

        {STEPS.slice(3).map(({ num, text }) => (
          <div key={num} className="flex items-start gap-3">
            <Badge
              variant="outline"
              className="h-6 w-6 shrink-0 rounded-full p-0 flex items-center justify-center text-xs font-bold border-primary/40 text-primary"
            >
              {num}
            </Badge>
            <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
          </div>
        ))}

        <p className="text-xs text-muted-foreground/70 pt-1 border-t border-border/30">
          Все данные хранятся только на вашем сервере и не передаются третьим лицам.
        </p>
        <p className="text-xs text-muted-foreground/60">
          📖 Подробнее:{' '}
          <a
            href="https://core.telegram.org/bots/telegram-login"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
          >
            core.telegram.org/bots/telegram-login
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

