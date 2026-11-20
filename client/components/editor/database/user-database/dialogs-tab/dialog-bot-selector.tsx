/** @fileoverview Выбор одного или всех ботов в диалогах с подтверждёнными счётчиками аудитории. */
import type { BotToken } from '@shared/schema';
import { BotTokenSelector } from '../components/header/bot-token-selector';
import { useBotAudienceCounts } from '../components/header/use-bot-audience-counts';

/** Параметры выбора области переписки: один бот либо все боты проекта. */
interface DialogBotSelectorProps {
  /** Открытый проект. */ projectId: number;
  /** Боты проекта. */ tokens: BotToken[];
  /** Выбранный бот; null означает всех ботов проекта. */ selectedTokenId: number | null;
  /** Обработчик выбора бота. */ onSelect: (id: number | null) => void;
  /** Показывать общую область всех ботов проекта. */ allowAll?: boolean;
}

/**
 * Показывает такие же числа аудитории, как селектор аналитики.
 * @param props - Проект, боты и обработчик выбора.
 * @returns Селектор с подтверждённой аудиторией без счётчика сохранённых профилей.
 */
export function DialogBotSelector(props: DialogBotSelectorProps) {
  /** Счётчики загружаются независимо от тяжёлого снимка аналитики. */
  const query = useBotAudienceCounts(props.projectId);
  return <BotTokenSelector {...props} allowAll={props.allowAll ?? true} audienceCounts={query.counts}
    countsError={query.isError && !query.data} onRetryCounts={() => { void query.refetch(); }} />;
}
