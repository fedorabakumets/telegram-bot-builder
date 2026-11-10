/** @fileoverview Аватар группы в выборе получателей рассылки. */
import { useState } from 'react';
import { Radio, Users } from 'lucide-react';
import { useGroupAccess } from '@/components/editor/database/user-database/hooks/use-group-access';

/** Свойства аватара группы. */
interface GroupAvatarProps {
  /** Проект группы. */
  projectId: number;
  /** Бот, связанный с группой. */
  tokenId: number;
  /** Идентификатор чата. */
  groupId: string;
  /** Название группы. */
  name: string;
  /** Тип чата. */
  chatType: string;
  /** Сохранённая фотография группы. */
  avatarUrl?: string | null;
}

/**
 * Показывает сохранённую фотографию или значок при её отсутствии.
 * @param props - Данные группы
 * @returns Аватар группы
 */
export function GroupAvatar({ projectId, tokenId, groupId, name, chatType, avatarUrl }: GroupAvatarProps) {
  const { data } = useGroupAccess(projectId, tokenId, groupId, chatType);
  const url = data?.avatarUrl !== undefined ? data.avatarUrl : avatarUrl;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (url && failedUrl !== url) {
    return <img src={url} alt={name} loading="lazy" className="h-7 w-7 shrink-0 rounded-full object-cover" onError={() => setFailedUrl(url)} />;
  }
  const Icon = chatType === 'channel' ? Radio : Users;
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center text-muted-foreground"><Icon className="h-4 w-4" /></span>;
}
