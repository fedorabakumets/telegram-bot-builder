/**
 * @fileoverview Краткое превью сохранённых данных пользователя с доступом к подробностям.
 */
import { Button } from '@/components/ui/button';
import { UserBotData } from '@shared/schema';
import { UserVariables } from '../details/user-variables';
import type { VariableToQuestionMap } from '../../types';

/** Свойства превью пользовательских данных. */
interface MobileUserDataPreviewProps {
  /** Подписи вопросов сценария. */
  variableToQuestionMap?: VariableToQuestionMap;
  /** Данные пользователя. */
  user: UserBotData;
  /** Открывает полные сведения о пользователе. */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
}

/**
 * Показывает переменные с раскрытием ответов и переходом к полным сведениям.
 * @param props - Пользователь и обработчик открытия подробностей.
 * @returns Строка превью и переход к данным.
 */
export function MobileUserDataPreview({ user, onOpenUserDetailsPanel, variableToQuestionMap }: MobileUserDataPreviewProps): React.JSX.Element {
  const entries = user.userData && typeof user.userData === 'object' && !Array.isArray(user.userData)
    ? Object.entries(user.userData) : [];
  return (
    <div className="flex min-w-0 items-start gap-3 border-t border-border/60 pt-3">
      <div className="min-w-0 flex-1 text-xs text-muted-foreground">
        <UserVariables user={user} variableToQuestionMap={variableToQuestionMap} />
      </div>
      {onOpenUserDetailsPanel && (
        <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2 text-xs"
          onClick={() => onOpenUserDetailsPanel(user)} aria-label={`Открыть данные пользователя ${user.userId}`}>
          Данные{entries.length > 0 ? ` · ${entries.length}` : ''}
        </Button>
      )}
    </div>
  );
}
