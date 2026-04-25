/**
 * @fileoverview Пошаговая инструкция по получению данных из BotFather
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

/** Шаги инструкции по получению данных из BotFather */
const STEPS: Step[] = [
  { num: 1, text: 'Открой @BotFather в Telegram' },
  { num: 2, text: 'Отправь /mybots → выбери нужного бота' },
  { num: 3, text: 'Bot Settings → Web Login → скопируй Client ID и Client Secret' },
  { num: 4, text: 'Bot Username — имя бота без символа @' },
  { num: 5, text: 'Bot Token — из команды /token (нужен для Mini App, опционально)' },
];

/**
 * Компонент пошаговой инструкции по настройке Telegram-интеграции.
 * Отображает карточку с нумерованными шагами для получения данных из BotFather.
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
        {STEPS.map(({ num, text }) => (
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
        <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border/30">
          Все данные хранятся только на вашем сервере и не передаются третьим лицам.
        </p>
      </CardContent>
    </Card>
  );
}
