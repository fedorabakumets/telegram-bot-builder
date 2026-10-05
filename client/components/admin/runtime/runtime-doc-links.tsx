/**
 * @fileoverview Ссылки на документы раздела под заголовком настроек рантайма
 * @module components/admin/runtime/runtime-doc-links
 */

import { Link } from 'wouter';
import { BookOpen } from 'lucide-react';
import type { RuntimeDocLink } from './runtime-types';

/** Свойства блока ссылок */
interface RuntimeDocLinksProps {
  /** Документы раздела, если API их прислал */
  docs?: RuntimeDocLink[];
}

/**
 * Мелкие ссылки на встроенный просмотр документов
 * @param props - Список ссылок раздела
 * @returns JSX элемент или null
 */
export function RuntimeDocLinks({ docs }: RuntimeDocLinksProps) {
  if (!docs?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {docs.map((doc) => (
        <Link
          key={doc.href}
          href={doc.href}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <BookOpen className="h-3.5 w-3.5" />
          {doc.label}
        </Link>
      ))}
    </div>
  );
}
