/**
 * @fileoverview История запусков бота в стиле Railway Deployments
 * @module bot/card/BotLaunchHistory
 */

import { useMemo, useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { useLaunchHistory } from '../hooks/use-launch-history';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import { useBotDetailTabOptional } from '../canvas/bot-detail-tab-context';
import { BotLaunchCard } from './BotLaunchCard';

/** Пропсы компонента истории запусков */
interface BotLaunchHistoryProps {
  /** ID токена бота */
  tokenId: number;
  /** ID проекта */
  projectId: number;
  /** Имя бота */
  botName: string;
  /** Компактный вид (внутри сетки настроек) */
  compact?: boolean;
}

/**
 * Текущий запуск + сворачиваемый список прошлых
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotLaunchHistory({
  tokenId,
  projectId,
  botName,
  compact = false,
}: BotLaunchHistoryProps) {
  const { history, isLoading } = useLaunchHistory(tokenId);
  const { openHistoryTab } = useActiveTerminals();
  const detailTab = useBotDetailTabOptional();
  const [historyOpen, setHistoryOpen] = useState(true);

  const { current, past } = useMemo(() => {
    const running = history.find((h) => h.status === 'running');
    const current = running ?? history[0] ?? null;
    const past = current
      ? history.filter((h) => h.id !== current.id).slice(0, compact ? 4 : 20)
      : [];
    return { current, past };
  }, [history, compact]);

  const handleShowLogs = (id: number, startedAt: Date | string | null) => {
    openHistoryTab({
      projectId,
      tokenId,
      botName,
      launchId: id,
      launchStartedAt: startedAt ? String(startedAt) : null,
    });
    detailTab?.setTab('terminal');
  };

  if (isLoading) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">Загрузка истории…</p>
    );
  }

  if (!current) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 px-4 py-10 text-center">
        <History className="mx-auto mb-2 h-5 w-5 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Пока нет запусков</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Запустите бота — запись появится здесь</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <h3 className="px-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Текущий
        </h3>
        <BotLaunchCard record={current} onShowLogs={handleShowLogs} featured />
      </div>

      {past.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center gap-1.5 px-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
            onClick={() => setHistoryOpen((v) => !v)}
            aria-expanded={historyOpen}
          >
            <ChevronDown
              className={[
                'h-3.5 w-3.5 transition-transform',
                historyOpen ? '' : '-rotate-90',
              ].join(' ')}
            />
            История
            <span className="ml-auto tabular-nums text-muted-foreground/70">{past.length}</span>
          </button>
          {historyOpen && (
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card divide-y divide-border/50">
              {past.map((record) => (
                <BotLaunchCard
                  key={record.id}
                  record={record}
                  onShowLogs={handleShowLogs}
                  embedded
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
