/**
 * @fileoverview Страница одного раздела настроек рантайма
 * @module components/admin/pages/admin-runtime
 */

import { Loader2, ServerCog } from 'lucide-react';
import { useParams } from 'wouter';
import { RuntimeDocLinks } from '../runtime/runtime-doc-links';
import { RuntimeSettingsForm } from '../runtime/runtime-settings-form';
import { useRuntimeSettings } from '../runtime/use-runtime-settings';

/**
 * Раздел /admin/runtime/:group
 * @returns JSX элемент страницы
 */
export function AdminRuntimePage() {
  const params = useParams<{ group: string }>();
  const group = params.group ?? '';
  const query = useRuntimeSettings(group);

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!query.data) {
    return <p className="text-muted-foreground">Раздел не найден</p>;
  }

  return (
    <div className="w-full min-w-0 max-w-6xl space-y-6">
      <div className="space-y-2">
        <h1 className="flex items-center gap-3 text-2xl font-semibold">
          {group === 'workers' ? <ServerCog className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
          {query.data.title}
        </h1>
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
          {group === 'workers' ? 'Нагрузка, память и правила запуска ботов. Настройте общие воркеры и поведение при простое.' : query.data.description}
        </p>
        {group === 'workers' ? <details className="text-sm text-muted-foreground">
          <summary className="w-fit cursor-pointer rounded focus-visible:outline focus-visible:outline-2">Справка по настройке</summary>
          <RuntimeDocLinks docs={query.data.docs} />
        </details> : <RuntimeDocLinks docs={query.data.docs} />}
      </div>
      <RuntimeSettingsForm data={query.data} />
    </div>
  );
}
