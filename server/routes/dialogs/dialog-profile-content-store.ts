/** @fileoverview Чтение сохранённых материалов профиля только из разрешённой области проекта. */
import { pool } from '../../database/db';
import { extractProfileLinks } from './dialog-profile-content-links';
import type { DialogProfileContentPage } from '../../../shared/dialog-profile-content';

/** Область сохранённых материалов, общая для списка и чтения файла. */
export interface ProfileContentScope {
  /** Проект с проверенным доступом. */ projectId: number;
  /** Пользователь или групповой чат. */ userId: string;
  /** Выбранный бот либо все боты проекта. */ tokenId: number | null;
  /** Профиль группового чата. */ isGroup: boolean;
}

/** Границы сообщений не включают ответы бота другим участникам группы. */
export const PROFILE_CONTENT_SCOPE_SQL = `m.project_id=$1 AND ($2::integer IS NULL OR m.token_id=$2) AND
  (($4::boolean AND m.chat_id=$3 AND m.chat_type IN ('group','supergroup','channel')) OR
   (NOT $4::boolean AND m.user_id=$3 AND (COALESCE(m.chat_type,'private')='private'
     OR (m.chat_type IN ('group','supergroup') AND m.message_type='user'))))`;

/** Возвращает параметры общей области SQL. @param scope - Выбранный профиль. @returns Значения параметров. */
export function profileContentParams(scope: ProfileContentScope) {
  return [scope.projectId, scope.tokenId, scope.userId, scope.isGroup];
}

/** Читает страницу материалов без обращения к Telegram. @param scope - Разрешённая область. @param beforeId - Курсор. @returns Материалы и следующий курсор. */
export async function readProfileContent(scope: ProfileContentScope, beforeId: number | null): Promise<DialogProfileContentPage> {
  const { rows } = await pool.query(`SELECT m.id,m.token_id,m.created_at,m.message_text,m.message_data,
    COALESCE(photos.items,'[]'::jsonb) photos FROM bot_messages m LEFT JOIN LATERAL (
      SELECT jsonb_agg(DISTINCT jsonb_build_object('id',f.id,'name',f.file_name)) items
      FROM bot_message_media mm JOIN media_files f ON f.id=mm.media_file_id AND f.project_id=m.project_id
      WHERE mm.message_id=m.id AND f.mime_type IN ('image/jpeg','image/png','image/webp','image/gif')
    ) photos ON true WHERE ${PROFILE_CONTENT_SCOPE_SQL} AND ($5::integer IS NULL OR m.id<$5)
      AND (photos.items IS NOT NULL OR m.message_text ~* 'https?://' OR m.message_data::text ~* 'https?://')
    ORDER BY m.id DESC LIMIT 41`, [...profileContentParams(scope), beforeId]);
  const page = rows.slice(0, 40);
  return { items: page.map(row => ({ messageId: row.id, tokenId: row.token_id ?? null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null, photos: row.photos,
    links: extractProfileLinks(row.message_text, row.message_data),
  })).filter(item => item.photos.length || item.links.length), beforeId: rows.length > 40 ? page[page.length - 1].id : null };
}
