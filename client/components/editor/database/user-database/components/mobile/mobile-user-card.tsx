/**
 * @fileoverview Компактная карточка пользователя с переходами к данным и переписке.
 */
import { useState } from 'react';
import { VariableToQuestionMap } from '../../types';
import { MobileUserDetailsDialog } from './mobile-user-details-dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { UserBotData } from '@shared/schema';
import { MobileUserHeader } from './mobile-user-header';
import { MobileUserBadges } from './mobile-user-badges';
import { MobileUserStats } from './mobile-user-stats';
import { MobileUserDataPreview } from './mobile-user-data-preview';

/** Свойства компактной карточки пользователя. */
interface MobileUserCardProps {
  /** Данные пользователя. */
  user: UserBotData;
  /** Соответствие переменных вопросам сценария. */
  variableToQuestionMap?: VariableToQuestionMap;
  /** Индекс карточки в списке. */
  index: number;
  /** Форматирует имя пользователя. */
  formatUserName: (user: UserBotData) => string;
  /** Открывает переписку с пользователем. */
  onNavigateToDialog?: (user: UserBotData) => void;
  /** Открывает сведения о пользователе. */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
}

/**
 * Показывает сведения без лишних вложенных карточек.
 * @param props - Данные пользователя и обработчики действий.
 * @returns Карточка пользователя.
 */
export function MobileUserCard(props: MobileUserCardProps): React.JSX.Element {
  const { user, index, onNavigateToDialog, onOpenUserDetailsPanel } = props;
  const [detailsOpen, setDetailsOpen] = useState(false);
  /** Открывает внешнюю панель либо локальный профиль пользователя. */
  const openDetails = () => onOpenUserDetailsPanel ? onOpenUserDetailsPanel(user) : setDetailsOpen(true);
  return (
    <Card className="rounded-lg border-border/60 p-4 shadow-none" data-testid={`user-card-mobile-${index}`}>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <MobileUserHeader {...props} />
          {onNavigateToDialog && (
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground"
              onClick={() => onNavigateToDialog(user)}
              aria-label={`Открыть диалог: ${props.formatUserName(user)}`} title="Открыть диалог">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        <MobileUserBadges user={user} />
        <MobileUserStats user={user} />
        <MobileUserDataPreview user={user} onOpenUserDetailsPanel={openDetails} />
      </div>
      {!onOpenUserDetailsPanel && detailsOpen && (
        <MobileUserDetailsDialog user={user} name={props.formatUserName(user)} open={detailsOpen} onOpenChange={setDetailsOpen} variableToQuestionMap={props.variableToQuestionMap} />
      )}
    </Card>
  );
}
