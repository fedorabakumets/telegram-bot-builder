/**
 * @fileoverview Просмотр документа раздела рантайма внутри панели
 * @module components/admin/pages/admin-guide
 */

import { useParams } from 'wouter';
import { AdminEmbedFrame } from '../admin-embed-frame';

/**
 * Оболочка iframe для /admin/guides/:slug
 * @returns JSX элемент страницы
 */
export function AdminGuidePage() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug ?? '';
  return (
    <AdminEmbedFrame
      title="Документация"
      embedSrc={`/admin/guides/embed/${encodeURIComponent(slug)}`}
    />
  );
}
