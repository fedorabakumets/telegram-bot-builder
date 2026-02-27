/**
 * @fileoverview Компонент строки таблицы пользователей
 * @description Объединяет все ячейки в одну строку с учётом видимости колонок
 */

import { TableRow } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { DesktopUserCell } from './desktop-user-cell';
import { DesktopLastMessageCell } from './desktop-last-message-cell';
import { DesktopActionsCell } from './desktop-actions-cell';

/**
 * Пропсы компонента DesktopTableRow
 */
interface DesktopTableRowProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Индекс в списке */
  index: number;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Функция открытия панели деталей */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
  /** Функция открытия диалога */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Функция переключения статуса */
  handleUserStatusToggle: (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => void;
  /** Мутация удаления пользователя */
  deleteUserMutation: any;
  /** Количество видимых колонок */
  visibleColumns?: number;
  /** ID проекта */
  projectId: number;
}

/**
 * Конфигурация ячеек строки
 */
const CELL_RENDERERS = [
  {
    key: 'user',
    render: (props: DesktopTableRowProps) => <DesktopUserCell user={props.user} formatUserName={props.formatUserName} projectId={props.projectId} />,
    alwaysVisible: true
  },
  {
    key: 'lastMessage',
    render: (props: DesktopTableRowProps) => <DesktopLastMessageCell user={props.user} projectId={props.projectId} />,
    alwaysVisible: true
  },
  {
    key: 'actions',
    render: (props: DesktopTableRowProps) => <DesktopActionsCell {...props} />,
    alwaysVisible: true
  },
];

/**
 * Компонент строки таблицы пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент строки
 */
export function DesktopTableRow(props: DesktopTableRowProps): React.JSX.Element {
  const { user, visibleColumns = 5 } = props;

  // Всегда показываем обязательные ячейки + дополнительные по visibleColumns
  const alwaysVisible = CELL_RENDERERS.filter(cell => cell.alwaysVisible);
  const optional = CELL_RENDERERS.filter(cell => !cell.alwaysVisible);
  
  // Показываем все обязательные + первые N опциональных
  const cellsToShow = [...alwaysVisible, ...optional.slice(0, Math.max(0, visibleColumns - alwaysVisible.length))];

  return (
    <TableRow
      key={user.id || props.index}
      className="border-b border-border/30 hover:bg-muted/30 transition-colors h-14 cursor-pointer"
      onClick={() => {
        props.onOpenUserDetailsPanel?.(user);
      }}
    >
      {cellsToShow.map((cell, idx) => (
        <cell.render key={`${user.id}-${cell.key}-${idx}`} {...props} />
      ))}
    </TableRow>
  );
}
