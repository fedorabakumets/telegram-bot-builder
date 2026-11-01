/** @fileoverview Ссылка из файла Telegram на исходное сообщение во вкладке диалогов. */
import { MessageSquare } from 'lucide-react';
import type { ProjectFile } from '../../hooks/use-project-files';

/**
 * Сохраняет проект, бота, чат и ID сообщения для точного перехода.
 * @param props - Файл сообщения и текущий проект
 * @returns Ссылка или отсутствие действия для загруженного файла
 */
export function FileMessageLink({ file, projectId }: { /** Файл из сообщения. */ file: ProjectFile; /** Текущий проект. */ projectId: number }) {
  if (file.source === 'uploaded' || file.userId == null || !file.tokenId) return null;
  const group = !!file.chatId && ['group', 'supergroup', 'channel'].includes(file.chatType ?? '');
  const params = new URLSearchParams({ tab: 'dialogs', bot: String(file.tokenId), dialogUser: String(group ? file.chatId : file.userId), message: String(file.id) });
  if (group) params.set('chatType', file.chatType!);
  return <a href={`/projects/${projectId}?${params}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><MessageSquare className="h-4 w-4" />К сообщению</a>;
}
