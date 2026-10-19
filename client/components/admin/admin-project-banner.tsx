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
}

/** Показывает административный режим и последние действия */
export function AdminProjectBanner({ projectId, onBack }: AdminProjectBannerProps) {
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

  return (
    <div className="fixed left-1/2 top-2 z-[100] -translate-x-1/2 rounded-md border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm text-amber-100 shadow-lg">
      <span>
        Административный режим · {projectInfo?.project?.name || `проект №${projectId}`}
        {projectInfo?.owner && ` · владелец @${projectInfo.owner.username || projectInfo.owner.firstName || 'без имени'}`}
      </span>
      <button className="ml-3 underline" onClick={() => setShowAudit((value) => !value)}>
        {showAudit ? 'Скрыть журнал' : 'Журнал действий'}
      </button>
      <button className="ml-3 underline" onClick={onBack}>Вернуться в админку</button>
      {showAudit && (
        <div className="absolute left-0 top-full mt-2 max-h-64 w-96 overflow-auto rounded-md border border-border bg-background p-3 text-xs text-foreground shadow-xl">
          {(data?.items ?? []).length === 0 ? <p>Записей пока нет.</p> : data?.items.map((entry, index) => (
            <div key={`${entry.createdAt}-${index}`} className="border-b border-border/60 py-2 last:border-0">
              <div className="font-medium">{entry.action}</div>
              <div className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString('ru-RU')} · {entry.ip || 'IP неизвестен'} · {entry.statusCode}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
