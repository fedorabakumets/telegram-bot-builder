/**
 * @fileoverview Страница одного раздела настроек рантайма
 * @module components/admin/pages/admin-runtime
 */

import { Loader2 } from 'lucide-react';
import { useParams } from 'wouter';
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
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{query.data.title}</h1>
        <p className="text-muted-foreground mt-1">{query.data.description}</p>
      </div>
      <RuntimeSettingsForm data={query.data} />
    </div>
  );
}
