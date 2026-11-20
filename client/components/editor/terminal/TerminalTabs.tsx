/** @fileoverview Раздельный выбор бота и запуска в терминале проекта. */
import { UsersBotSelector } from '../database/user-database/components/header/users-bot-selector';
import '../database/user-database/content/users-workspace.css';
import { useActiveTerminals } from '../bot/contexts/ActiveTerminalsContext';
import type { TerminalInfo } from '../bot/contexts/ActiveTerminalsContext';
import { getBotDisplayName } from '../bot/contexts/bot-control-utils';
import { useBotQueries } from '../bot/hooks/use-bot-queries';
import { TerminalLaunchSelector } from './TerminalLaunchSelector';

interface TerminalTabsProps {
  /** Идентификатор проекта, выбранного в шапке. */
  currentProjectId?: number;
  /** Обработчик выбора ключа терминала. */
  onTerminalSelect: (key: string) => void;
}

/**
 * Возвращает ключ терминала, совпадающий с ключом контекста.
 * @param terminal - Открытый терминал.
 * @returns Ключ записи живого вывода или истории.
 */
function getTerminalKey(terminal: TerminalInfo) {
  return terminal.tabType === 'history'
    ? `history_${terminal.launchId}`
    : `${terminal.projectId}_${terminal.tokenId}`;
}

/**
 * Показывает ботов проекта и запуски выбранного бота.
 * @param props - Текущий проект и обработчик выбора терминала.
 * @returns Два селектора терминала.
 */
export function TerminalTabs({ currentProjectId, onTerminalSelect }: TerminalTabsProps) {
  const { terminals, activeTerminalId, addTerminal, setActiveTerminalById, openHistoryTab } = useActiveTerminals();
  const { allTokensFlat, allBotStatuses } = useBotQueries({ includeBotInfo: false });
  const active = terminals.find(terminal => getTerminalKey(terminal) === activeTerminalId);
  const projectId = currentProjectId ?? active?.projectId;
  const selected = active?.projectId === projectId ? active : undefined;
  const tokens = allTokensFlat.filter(token => token.projectId === projectId);

  /**
   * Открывает живой вывод выбранного бота.
   * @param tokenId - Идентификатор выбранного бота.
   */
  function selectBot(tokenId: number) {
    const token = tokens.find(candidate => candidate.id === tokenId);
    const botName = token ? getBotDisplayName(token, `Бот #${tokenId}`) : selected?.botName;
    if (projectId === undefined || botName === undefined) return;
    const key = `${projectId}_${tokenId}`;
    if (terminals.some(terminal => getTerminalKey(terminal) === key)) {
      setActiveTerminalById(key);
    } else {
      const isRunning = allBotStatuses.some(status => status.tokenId === tokenId && status.status === 'running');
      addTerminal({ projectId, tokenId, botName, isRunning });
    }
    onTerminalSelect(key);
  }

  return (
    <div className="terminal-launch-controls flex min-w-0 items-center gap-2">
      {projectId !== undefined && <UsersBotSelector
        projectId={projectId}
        tokens={tokens}
        selectedTokenId={selected?.tokenId ?? null}
        allowAll={false}
        showRuntimeStatus
        emptySelectionLabel="Выберите бота"
        onSelect={id => { if (id !== null) selectBot(id); }}
      />}
      {selected && <TerminalLaunchSelector
        terminal={{ ...selected, isRunning: allBotStatuses.find(status => status.tokenId === selected.tokenId)
          ? allBotStatuses.some(status => status.tokenId === selected.tokenId && status.status === 'running')
          : selected.isRunning }}
        onCurrent={() => selectBot(selected.tokenId)}
        onHistory={(launchId, launchStartedAt) => {
          openHistoryTab({
            projectId: selected.projectId,
            tokenId: selected.tokenId,
            botName: selected.botName,
            launchId,
            launchStartedAt,
          });
          onTerminalSelect(`history_${launchId}`);
        }}
      />}
    </div>
  );
}
