/**
 * @fileoverview Страница документации схемы базы данных
 * @module components/admin/pages/admin-schema
 */

import { useParams } from 'wouter';
import { AdminEmbedFrame } from '../admin-embed-frame';

/**
 * Показывает опубликованную схему базы во фрейме с возвратом в панель.
 * @returns JSX элемент страницы схемы БД
 */
export function AdminSchemaPage() {
  const params = useParams<{ tableName?: string }>();
  const tableName = params.tableName && params.tableName !== 'embed' ? params.tableName : undefined;
  const docsUrl = 'https://fedorabakumets.github.io/telegram-bot-builder/docs/database';
  const embedSrc = tableName ? `${docsUrl}/${encodeURIComponent(tableName)}` : docsUrl;

  return (
    <AdminEmbedFrame
      title={tableName ?? 'Схема базы данных'}
      embedSrc={embedSrc}
      backHref={tableName ? '/admin/schema' : '/admin'}
      backLabel="Назад"
    />
  );
}
