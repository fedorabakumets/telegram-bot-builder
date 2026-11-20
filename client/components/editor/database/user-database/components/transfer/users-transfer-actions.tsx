/** @fileoverview Кнопки переноса пользователей с учётом текущей области и фильтров. */
import { useState } from 'react';
import type { BotToken } from '@shared/schema';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDirectoryControls } from '../../content/user-directory-controls';
import { UsersExportDialog } from './users-export-dialog';
import { UsersImportDialog } from './users-import-dialog';
/** Область переноса и параметры списка. */
interface UsersTransferActionsProps {
  /** Текущий проект. */ projectId: number;
  /** Название для файла. */ projectName: string;
  /** Выбранный бот либо общая область. */ tokenId: number | null;
  /** Боты для выбора назначения импорта. */ tokens: BotToken[];
  /** Текст поиска. */ search: string;
  /** Обновление списка после записи. */ onRefresh: () => void;
}
/** Показывает действия переноса перед очисткой базы. @param props - Область и фильтры. @returns Кнопки и формы. */
export function UsersTransferActions(props: UsersTransferActionsProps) {
  const [mode, setMode] = useState<'export' | 'import' | null>(null);
  /** Название берётся из уже загруженных ботов без дополнительного запроса. */
  const selectedBot = props.tokens.find(bot => bot.id === props.tokenId);
  const botName = selectedBot ? [selectedBot.botFirstName || selectedBot.name, selectedBot.botUsername ? `(@${selectedBot.botUsername.replace(/^@/, '')})` : ''].filter(Boolean).join(' ') : undefined;
  const controls = useDirectoryControls();
  const query: Record<string, string> = {};
  if (props.search) query.search = props.search;
  if (controls?.source) query.source = controls.source;
  if (controls?.status && controls.status !== 'all') query.status = controls.status;
  if (controls?.premium && controls.premium !== 'all') query.premium = controls.premium;
  const advanced = { ...controls?.advanced, ...(props.tokenId ? { bots: undefined } : {}) };
  if (Object.values(advanced).some(value => value !== undefined)) query.filters = JSON.stringify(advanced);
  if (controls?.field) { query.sortBy = controls.field; query.sortDir = controls.direction; }
  return <>
    <Button variant="outline" size="sm" className="h-8 gap-2 rounded-lg px-3 text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={() => setMode('export')}>
      <Download className="h-4 w-4" /><span>Экспорт</span>
    </Button>
    <Button variant="outline" size="sm" className="h-8 gap-2 rounded-lg px-3 text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={() => setMode('import')}>
      <Upload className="h-4 w-4" /><span>Импорт</span>
    </Button>
    {mode === 'export' && <UsersExportDialog key={`${props.projectId}:${props.tokenId}`} {...props} botName={botName} query={query} total={controls?.result?.total} onClose={() => setMode(null)} />}
    {mode === 'import' && <UsersImportDialog key={`${props.projectId}:${props.tokenId}`} {...props} onClose={() => setMode(null)} />}
  </>;
}
