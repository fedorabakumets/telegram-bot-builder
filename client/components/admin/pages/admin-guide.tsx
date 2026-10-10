/**
 * @fileoverview Просмотр документа раздела рантайма внутри панели
 * @module components/admin/pages/admin-guide
 */

import { useParams } from 'wouter';
import { AdminEmbedFrame } from '../admin-embed-frame';

/** Разделы настроек, из которых открываются инструкции */
const GUIDE_GROUPS: Record<string, string> = {
  'uploads-s3': 'storages',
  'db-backups': 'backups',
  'worker-docker': 'workers',
  'bot-runner': 'runners',
  'bot-railway': 'runners',
  'bot-builds': 'builds',
  'bot-database-access': 'platform',
  'bot-manager-auth': 'platform',
  'mcp-http': 'platform',
  'admin-settings': 'platform',
};

/**
 * Оболочка фрейма опубликованного сайта документации для /admin/guides/:slug
 * @returns JSX элемент страницы
 */
export function AdminGuidePage() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug ?? '';
  return (
    <AdminEmbedFrame
      title="Документация"
      backHref={`/admin/runtime/${GUIDE_GROUPS[slug] ?? 'platform'}`}
      backLabel="Назад"
      embedSrc={`/admin/guides/embed/${encodeURIComponent(slug)}`}
    />
  );
}
