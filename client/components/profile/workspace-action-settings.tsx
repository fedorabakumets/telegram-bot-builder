/** @fileoverview Управление порядком и видимостью кнопок выбранной рабочей вкладки. */
import { OrderedVisibilitySettings } from './ordered-visibility-settings';
import { setWorkspaceHeaderPreferences, type WorkspaceHeaderPreferences, type WorkspaceTabKey } from '@/components/ui/workspace-header-preferences';

/** Названия настраиваемых элементов шапки. */
const titles: Record<string, string> = {
  docs: 'Документация', refresh: 'Обновить', view: 'Список / Холст', connect: 'Подключить бота',
  filters: 'Фильтры', broadcast: 'Рассылка', learning: 'Обучение', support: 'Поддержка',
  project: 'Селектор проекта', bot: 'Селектор бота',
  github: 'GitHub', telegram: 'Telegram', more: 'Ещё', help: 'Помощь',
};

/** Дополнительные элементы, доступные на конкретных вкладках. */
const customOrder: Partial<Record<WorkspaceTabKey, string[]>> = {
  editor: ['learning', 'support', 'github', 'telegram', 'more', 'help'],
  bot: ['view', 'connect', 'docs', 'refresh'],
  analytics: ['filters', 'docs', 'refresh'],
  dialogs: ['docs', 'refresh', 'broadcast'],
};

/** Свойства списка настроек действий. */
interface WorkspaceActionSettingsProps {
  /** Вкладка, к которой относятся изменения. */
  tab: WorkspaceTabKey;
  /** Текущие настройки вкладки. */
  preferences: WorkspaceHeaderPreferences;
  /** Настраивает селекторы вместо кнопок. */
  kind?: 'actions' | 'selectors';
}

/**
 * Меняет видимость и порядок кнопок, не теряя настройки скрытых элементов.
 * @param props - Вкладка и её текущие настройки.
 * @returns Список действий с переключателями и стрелками.
 */
export function WorkspaceActionSettings({ tab, preferences, kind = 'actions' }: WorkspaceActionSettingsProps) {
  const selectors = kind === 'selectors';
  if (selectors && tab === 'agent') return null;
  const hasBot = ['terminal', 'users', 'dialogs', 'analytics', 'tables', 'files'].includes(tab);
  const available = selectors ? (hasBot ? ['project', 'bot'] : ['project']) : customOrder[tab] ?? ['docs', 'refresh'];
  const orderField = selectors ? 'selectorOrder' : 'actionOrder';
  const hiddenField = selectors ? 'hiddenSelectors' : 'hiddenActions';
  const hidden = preferences[hiddenField];
  const configured = preferences[orderField].filter(id => available.includes(id));
  const items = [...configured, ...available.filter(id => !configured.includes(id))];

  return (
    <OrderedVisibilitySettings
      legend={selectors ? 'Селекторы шапки' : 'Отдельные кнопки шапки'}
      idPrefix="layout-action" items={items} titles={titles} hidden={hidden}
      onOrderChange={order => setWorkspaceHeaderPreferences(tab, { ...preferences, [orderField]: order })}
      onHiddenChange={keys => setWorkspaceHeaderPreferences(tab, { ...preferences, [hiddenField]: keys })}
    />
  );
}
