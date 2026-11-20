/** @fileoverview Общий выбор одного или всех ботов для проверки и удаления пользователей. */
/** Доступные пользователю реквизиты бота без служебных данных. */
interface BotOption {
  /** Идентификатор бота. */ id: number;
  /** Публичный username. */ botUsername?: string | null;
  /** Имя в Telegram. */ botFirstName?: string | null;
  /** Название в проекте. */ name?: string | null;
}
/**
 * Показывает одинаковую область действия в окнах пользователей.
 * @param props - Боты, выбранная область и назначение действия.
 * @returns Подписанный выбор бота в стиле окна проверок.
 */
export function CheckBotScopeSelect({tokens,value,onChange,label='Бот для проверки',disabled=false}: {
  /** Боты текущего проекта. */ tokens: BotOption[];
  /** Конкретный бот, весь проект либо отсутствие выбора. */ value: number | 'all' | null;
  /** Изменяет область только текущего окна. */ onChange: (value:number|'all')=>void;
  /** Понятное назначение выбора. */ label?: string;
  /** Изменение области временно недоступно. */ disabled?: boolean;
}) {
  return <label className="flex flex-col gap-1 text-sm font-medium">
    {label}
    <select aria-label={label} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
      disabled={disabled} value={value??''} onChange={event=>onChange(event.target.value==='all'?'all':Number(event.target.value))}>
      <option value="" disabled>Выберите бота</option>
      <option value="all">Все боты проекта · {tokens.length}</option>
      {tokens.map(token=><option key={token.id} value={token.id}>{token.botUsername?`@${token.botUsername}`:token.botFirstName||token.name||`Бот №${token.id}`}</option>)}
    </select>
  </label>;
}
