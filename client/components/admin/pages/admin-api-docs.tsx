/**
 * @fileoverview Опубликованный справочник API во фрейме панели управления.
 * @module components/admin/pages/admin-api-docs
 */

import { useParams } from 'wouter';
import { AdminEmbedFrame } from '../admin-embed-frame';

/**
 * Открывает справочник сайта документации с возвратом в панель или список разделов.
 * @returns JSX элемент страницы справочника
 */
export function AdminApiDocsPage() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug && params.slug !== 'embed' ? params.slug : undefined;
  const docsUrl = 'https://fedorabakumets.github.io/telegram-bot-builder/docs/api';
  const embedSrc = slug ? `${docsUrl}/${encodeURIComponent(slug)}` : docsUrl;

  return (
    <AdminEmbedFrame
      title={slug ?? 'Справочник API'}
      embedSrc={embedSrc}
      backHref={slug ? '/admin/api-docs' : '/admin'}
      backLabel="Назад"
    />
  );
}
