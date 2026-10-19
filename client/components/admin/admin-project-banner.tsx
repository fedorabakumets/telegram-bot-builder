/**
 * @fileoverview Плашка административного режима проекта и его журнала
 * @module components/admin/admin-project-banner
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';

/** Запись журнала действий проекта */
interface AuditEntry {
  /** Название действия */
  action: string;
  /** Код ответа */
  statusCode: number;
  /** IP-адрес администратора */
  ip: string | null;
  /** Время действия */
  createdAt: string;
}

/** Безопасные сведения о проекте и его владельце */
interface AdminProjectInfo {
  /** Название проекта */
  project?: { name?: string };
  /** Владелец проекта */
  owner?: { username?: string | null; firstName?: string | null } | null;
}

/** Свойства плашки административного режима */
interface AdminProjectBannerProps {
  /** Идентификатор проекта */
  projectId: number | null;
  /** Переход назад в админскую карточку */
  onBack: () => void;
  /** Встроить панель в шапку вместо фиксированного положения */
  embedded?: boolean;
}

/** Показывает административный режим и последние действия */
export function AdminProjectBanner({ projectId, onBack, embedded = false }: AdminProjectBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const { data: projectInfo } = useQuery<AdminProjectInfo>({
    queryKey: ['/admin/api/projects', projectId],
    queryFn: () => apiRequest('GET', `/admin/api/projects/${projectId}`),
    enabled: projectId != null,
  });
  const { data } = useQuery<{ items: AuditEntry[] }>({
    queryKey: ['/admin/api/projects', projectId, 'audit'],
    queryFn: () => apiRequest('GET', `/admin/api/projects/${projectId}/audit`),
    enabled: showAudit && projectId != null,
  });

  const projectName = projectInfo?.project?.name || `Проект №${projectId}`;
  const ownerName = projectInfo?.owner?.username || projectInfo?.owner?.firstName || 'без имени';

  return (
    <div className={`${embedded ? 'relative w-auto' : 'fixed right-4 top-16 w-[min(420px,calc(100vw-2rem))]'} z-[100] text-sm`}>
      {!isOpen ? (
        <button
          className="ml-auto flex max-w-full items-center gap-2 rounded-full border border-amber-500/50 bg-amber-950/90 px-3 py-2 text-amber-100 shadow-lg backdrop-blur"
          onClick={() => setIsOpen(true)}
          title="Открыть панель административного режима"
        >
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="truncate">Админ-режим · {projectName}</span>
        </button>
      ) : (
        <div className="absolute right-0 top-full mt-2 w-[min(420px,calc(100vw-2rem))] rounded-lg border border-amber-500/50 bg-background/95 p-3 text-foreground shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-amber-200">Административный режим</div>
              <div className="truncate text-muted-foreground">{projectName}</div>
              <div className="truncate text-xs text-muted-foreground">Владелец: @{ownerName}</div>
            </div>
            <button className="text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)} aria-label="Свернуть панель">×</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded border border-border px-2 py-1 hover:bg-muted" onClick={() => setShowAudit((value) => !value)}>
              {showAudit ? 'Скрыть журнал' : 'Журнал действий'}
            </button>
            <button className="rounded border border-amber-500/60 px-2 py-1 text-amber-200 hover:bg-amber-500/10" onClick={onBack}>Вернуться в админку</button>
          </div>
          {showAudit && (
            <div className="mt-3 max-h-64 overflow-auto rounded border border-border bg-background p-3 text-xs">
              {(data?.items ?? []).length === 0 ? <p>Записей пока нет.</p> : data?.items.map((entry, index) => (
                <div key={`${entry.createdAt}-${index}`} className="border-b border-border/60 py-2 last:border-0">
                  <div className="font-medium">{entry.action}</div>
                  <div className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString('ru-RU')} · {entry.ip || 'IP неизвестен'} · {entry.statusCode}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
