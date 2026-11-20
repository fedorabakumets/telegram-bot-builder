/** @fileoverview Превью переменных в таблице и отдельная панель всех ответов и вложений. */
import { ChevronRight } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { UserBotData } from '@shared/schema';
import type { VariableToQuestionMap } from '../../types';
import { ResponseCard } from './response-card';
/** Поля профиля уже видны в первой колонке и уступают место переменным сценария. */
const profileFields = new Set(['username', 'user_name', 'first_name', 'last_name', 'user_id', 'chat_id', 'language_code', 'is_premium']);

/**
 * Форматирует краткое значение переменной без потери нулей и логических значений.
 * @param value - Сохранённая переменная или структурированный ответ.
 * @returns Текст для компактного просмотра.
 */
export function variablePreview(value: unknown): string {
  if (value == null) return 'Не заполнено';
  if (typeof value === 'string') {
    try { return variablePreview(JSON.parse(value)); } catch { return value || 'Не заполнено'; }
  }
  if (typeof value === 'object') {
    if ('value' in value) return variablePreview(value.value);
    if ('media' in value && Array.isArray(value.media) && value.media.length) return `Вложений: ${value.media.length}`;
    if ('type' in value && typeof value.type === 'string') return `Вложение · ${value.type}`;
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Показывает первые переменные в строке и открывает полный список вне таблицы.
 * @param props - Пользователь и подписи вопросов сценария.
 * @returns Компактный список переменных в стиле таблицы аналитики.
 */
export function UserVariables({ user, variableToQuestionMap = {} }: {
  /** Сохранённые данные пользователя. */ user: UserBotData;
  /** Подписи вопросов для переменных ответов. */ variableToQuestionMap?: VariableToQuestionMap;
}) {
  const entries = user.userData && typeof user.userData === 'object' && !Array.isArray(user.userData)
    ? Object.entries(user.userData) : [];
  if (!entries.length) return <span className="text-xs text-muted-foreground">Нет переменных</span>;
  /** Сначала показывает переменные сценария, сохраняя все исходные поля в раскрытии. */
  const preview = [...entries].sort(([left], [right]) => Number(profileFields.has(left)) - Number(profileFields.has(right))).slice(0, 2);
  return <div className="users-variables">
      <dl className="users-variables-preview">
        {preview.map(([key, value]) => <div key={key} title={`${key}: ${variablePreview(value)}`}>
          <dt>{key}</dt><dd>{variablePreview(value)}</dd>
        </div>)}
      </dl>
    <Sheet>
      <SheetTrigger asChild><button type="button" className="users-variables-toggle"
        aria-label={`Переменные пользователя ${user.userId}: ${entries.length}`}>
        Переменные · {entries.length}<ChevronRight aria-hidden="true" />
      </button></SheetTrigger>
      <SheetContent className="users-portal users-variables-panel flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border p-6 text-left">
          <SheetTitle>Переменные пользователя</SheetTitle>
          <SheetDescription>{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.userId}
            {user.userName ? ` · @${user.userName}` : ''}
            {user.botMemberships?.length === 1 ? ` · ${user.botMemberships[0].username ? '@' + user.botMemberships[0].username : user.botMemberships[0].name}` : ''}</SheetDescription>
        </SheetHeader>
        <div className="users-variables-values min-h-0 flex-1 overflow-y-auto p-6">
          {entries.map(([key, value]) => <ResponseCard key={key} keyName={key} value={value}
            variableToQuestionMap={variableToQuestionMap} getPhotoUrlFromMessages={() => null} />)}
        </div>
      </SheetContent>
    </Sheet>
  </div>;
}
