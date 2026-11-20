/**
 * @fileoverview Компактная карточка пользователя с переходами к данным и переписке.
 */
import { UserContactOrigin } from '../desktop/user-contact-origin';
import { useState } from 'react';
import { VariableToQuestionMap } from '../../types';
import { Card } from '@/components/ui/card';
import { UserBotData } from '@shared/schema';
import { MobileUserHeader } from './mobile-user-header';
import { MobileUserBadges } from './mobile-user-badges';
import { MobileUserStats } from './mobile-user-stats';
import { MobileUserDataPreview } from './mobile-user-data-preview';
import { MobileBotBreakdown } from './mobile-bot-breakdown';
import { UserBotsToggle } from '../desktop/user-bots-toggle';
import { shouldToggleUserRow } from '../../utils/should-toggle-user-row';
import { DesktopActionsCell } from '../desktop/desktop-actions-cell';

/** Свойства компактной карточки пользователя. */
interface MobileUserCardProps {
  /** Те же действия удаления, что доступны в широкой таблице. */
  deleteUserMutation?: import('react').ComponentProps<typeof DesktopActionsCell>['deleteUserMutation'];
  /** Проект для аватара. */
  projectId?: number;
  /** Выбранный бот для аватара. */
  tokenId?: number | null;
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
  const { user, index } = props;
  const [botsExpanded, setBotsExpanded] = useState(false);
  const botCount = props.tokenId == null ? user.botMemberships?.length ?? 0 : 0;
  return (
    <Card className="rounded-lg border-border/60 p-4 shadow-none" data-testid={`user-card-mobile-${index}`}
      data-expandable={botCount > 1 || undefined}
      onClick={event => { if (botCount > 1 && shouldToggleUserRow(event)) setBotsExpanded(value => !value); }}>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <MobileUserHeader {...props} />
          {props.deleteUserMutation && <DesktopActionsCell inCard user={user} index={index} formatUserName={props.formatUserName} deleteUserMutation={props.deleteUserMutation} />}
        </div>
        <MobileUserBadges user={user} />
        <UserContactOrigin user={user} />
        <MobileUserStats user={user} />
        <MobileUserDataPreview user={user} variableToQuestionMap={props.variableToQuestionMap} />
        {botCount > 1 && <UserBotsToggle userId={user.userId} count={botCount} expanded={botsExpanded} onToggle={() => setBotsExpanded(value => !value)} />}
        {botCount > 1 && botsExpanded && <div data-user-bot-details><MobileBotBreakdown user={user} variableToQuestionMap={props.variableToQuestionMap} onNavigate={props.onNavigateToDialog} /></div>}
      </div>
    </Card>
  );
}
