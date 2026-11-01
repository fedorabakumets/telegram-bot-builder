/** @fileoverview Документация агента и обновление подключений без изменения прав доступа. */
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { WorkspaceTabActions } from '@/components/ui/workspace-tab-actions';

/**
 * Обновляет подключения и токены текущего профиля одной кнопкой.
 * @returns Служебные действия вкладки агента
 */
export function AgentHeaderActions() {
  const client = useQueryClient();
  const tokens = useIsFetching({ queryKey: ['/api/agent-tokens'] });
  const connections = useIsFetching({ queryKey: ['/api/agent-connections'] });
  /** Повторно запрашивает только данные агента, сохраняя открытые формы. */
  const refresh = () => {
    void client.refetchQueries({ queryKey: ['/api/agent-tokens'], exact: true });
    void client.refetchQueries({ queryKey: ['/api/agent-connections'], exact: true });
  };
  return <WorkspaceTabActions docsPath="interface/agent" section="Агент" onRefresh={refresh} isRefreshing={!!(tokens || connections)} />;
}
