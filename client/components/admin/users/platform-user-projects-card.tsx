/**
 * @fileoverview Перечень проектов аккаунта в карточке
 * @module components/admin/users/platform-user-projects-card
 */

import { Link } from 'wouter';
import { ExternalLink } from 'lucide-react';
import type {
  PlatformUserProjectSummary,
  PlatformUserSharedProjectSummary,
} from '@shared/admin/platform-users.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPlatformUserDate } from './platform-user-avatar';

/** Пропсы карточки проектов */
interface PlatformUserProjectsCardProps {
  /** Заголовок блока */
  title: string;
  /** Проекты во владении */
  ownedProjects?: PlatformUserProjectSummary[];
  /** Проекты, где участник */
  sharedProjects?: PlatformUserSharedProjectSummary[];
}

/**
 * Список проектов с переходом в редактор
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function PlatformUserProjectsCard({
  title,
  ownedProjects,
  sharedProjects,
}: PlatformUserProjectsCardProps) {
  const rows = ownedProjects ?? sharedProjects ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет проектов.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {ownedProjects?.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Создан {formatPlatformUserDate(project.createdAt)} · изменён{' '}
                    {formatPlatformUserDate(project.updatedAt)}
                  </p>
                </div>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline shrink-0"
                >
                  Редактор
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
            {sharedProjects?.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Владелец: {project.ownerDisplayName} · изменён{' '}
                    {formatPlatformUserDate(project.updatedAt)}
                  </p>
                </div>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline shrink-0"
                >
                  Редактор
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
