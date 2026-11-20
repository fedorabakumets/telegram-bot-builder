/** @fileoverview Выбор бота с быстрыми согласованными счётчиками аудитории. */
import type { ComponentProps } from 'react';
import { BotTokenSelector } from './bot-token-selector';
import { useBotAudienceCounts } from './use-bot-audience-counts';
/** Свойства селектора с подтверждённой аудиторией. */
type UsersBotSelectorProps = Omit<ComponentProps<typeof BotTokenSelector>, 'audienceCounts'>;
/** Показывает готовые числа без ожидания снимка графиков. @param props - Проект и выбранный бот. @returns Селектор аудитории. */
export function UsersBotSelector(props: UsersBotSelectorProps): React.JSX.Element {
  const query = useBotAudienceCounts(props.projectId);
  return <BotTokenSelector {...props} audienceCounts={query.counts} countsError={query.isError && !query.data}
    onRetryCounts={() => { void query.refetch(); }} />;
}
