/** @fileoverview Источник, раздельные действия и статус в строке пользователя. */
import { sourceColor } from '@shared/source-color';
import { TableCell } from '@/components/ui/table';
import type { UserBotData } from '@shared/schema';
import { formatDate } from '../../../utils';
import { userSource, userStatus } from './user-summary';
import { UserVariables } from '../details/user-variables';
import { statusAppearance } from '@shared/status-appearance';
import type { VariableToQuestionMap } from '../../types';

/**
 * Показывает сохранённые сведения без смешивания ответов бота и действий человека.
 * @param props - Пользователь текущей строки.
 * @returns Дополнительные ячейки таблицы.
 */
export function DesktopMetricCells({ user, variableToQuestionMap }: {
  /** Пользователь бота. */ user: UserBotData;
  /** Подписи вопросов для переменных. */ variableToQuestionMap?: VariableToQuestionMap;
}) {
  const source = userSource(user);
  /** Общая подпись определяет оформление без повторных проверок флагов пользователя. */
  const status = userStatus(user);
  return <>
    <TableCell className="users-source-cell"><span title={source} style={{ color: sourceColor(source) }}>{source}</span></TableCell>
    <TableCell className="users-variables-cell"><UserVariables user={user} variableToQuestionMap={variableToQuestionMap} /></TableCell>
    <TableCell className="text-right tabular-nums" title="Сохранённые входящие сообщения без нажатий">{user.incomingMessageCount?.toLocaleString('ru-RU') ?? '—'}</TableCell>
    <TableCell className="text-right tabular-nums" title="Сохранённые нажатия кнопок">{user.buttonClickCount?.toLocaleString('ru-RU') ?? '—'}</TableCell>
    <TableCell title={formatDate(user.lastInteraction)} className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(user.lastInteraction)}</TableCell>
    <TableCell><span className="users-status" style={{ color: statusAppearance(status).color }}>{status}</span></TableCell>
  </>;
}
