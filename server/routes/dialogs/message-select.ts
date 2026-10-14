/** @fileoverview Общая выборка безопасных данных сообщений и источников чата. */

/** SQL-проекция истории и поиска без произвольных внутренних полей. */
export const dialogMessageSelect = `SELECT m.id, m.user_id, m.message_type, m.message_text, m.message_data,
    m.telegram_message_id, COALESCE(m.chat_type, 'private') AS chat_type,
    COALESCE(m.chat_id, m.user_id) AS chat_id, date_trunc('milliseconds', m.created_at) AS created_at,
    bg.name AS source_chat_title, COALESCE(media.items, '[]'::jsonb) AS media
    FROM bot_messages m LEFT JOIN LATERAL (
      SELECT name FROM bot_groups WHERE project_id = m.project_id AND token_id = m.token_id
        AND group_id = m.chat_id ORDER BY id DESC LIMIT 1
    ) bg ON m.chat_type IN ('group', 'supergroup', 'channel')
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object('id', f.id, 'file_name', f.file_name,
        'file_type', f.file_type, 'file_size', f.file_size, 'mime_type', f.mime_type,
        'media_kind', mm.media_kind, 'order_index', mm.order_index)
        ORDER BY mm.order_index, mm.id) AS items
      FROM bot_message_media mm JOIN media_files f ON f.id = mm.media_file_id
      WHERE mm.message_id = m.id AND f.project_id = m.project_id
    ) media ON true
`;
