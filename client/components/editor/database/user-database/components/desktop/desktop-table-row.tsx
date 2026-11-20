/**
 * @fileoverview Компонент строки таблицы пользователей
 * @description Объединяет все ячейки в одну строку с учётом видимости колонок
 */

import { TableRow } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { DesktopUserCell } from './desktop-user-cell';
import { DesktopMetricCells } from './desktop-metric-cells';
import { DesktopActionsCell } from './desktop-actions-cell';
import type { VariableToQuestionMap } from '../../types';
import { UserBotRows } from './user-bot-rows';
import { UserBotsToggle } from './user-bots-toggle';
import { useState } from 'react';
import { shouldToggleUserRow } from '../../utils/should-toggle-user-row';

/**
 * Пропсы компонента DesktopTableRow
 */
interface DesktopTableRowProps {
  /** Подписи вопросов для сохранённых переменных. */
  variableToQuestionMap?: VariableToQuestionMap;
  /** Данные пользователя */
  user: UserBotData;
  /** Индекс в списке */
  index: number;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Мутация удаления пользователя */
  deleteUserMutation: any;
  /** Количество видимых колонок */
  visibleColumns?: number;
  /** ID проекта */
  projectId: number;
  /** ID токена для резолва аватара */
  tokenId?: number | null;
  /** Открытие панели деталей пользователя */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
  /** Открытие диалоговой панели */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Переход на вкладку «Диалоги» с пользователем */
  onNavigateToDialog?: (user: UserBotData) => void;
}

/**
 * Компонент строки таблицы пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент строки
 */
export function DesktopTableRow(props: DesktopTableRowProps): React.JSX.Element {
  const { user } = props;
  const [expanded, setExpanded] = useState(false);
  const count = user.botMemberships?.length ?? 0;
  const hasBots = props.tokenId == null && count > 1;

  return (
    <><TableRow
      key={user.id || props.index}
      className="border-b border-border/30 hover:bg-muted/20 h-14"
      data-expandable={hasBots || undefined}
      onClick={event => { if (hasBots && shouldToggleUserRow(event)) setExpanded(value => !value); }}
    >
      <DesktopUserCell {...props}>{hasBots && <UserBotsToggle userId={user.userId} count={count}
        expanded={expanded} onToggle={() => setExpanded(value => !value)} />}</DesktopUserCell>
      <DesktopMetricCells user={user} variableToQuestionMap={props.variableToQuestionMap} />
      <DesktopActionsCell {...props} />
    </TableRow>
    {hasBots && expanded && <UserBotRows user={user} variableToQuestionMap={props.variableToQuestionMap}
      onNavigate={props.onNavigateToDialog ?? props.onOpenDialogPanel} />}</>
  );
}
