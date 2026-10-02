/**
 * @fileoverview Панель переменных окружения бота (режим «Переменные»)
 * Отображает системные и пользовательские переменные с dirty state
 * @module components/editor/bot/card/BotEnvPanel
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { BotEnvRow } from './BotEnvRow';
import { BotEnvAddRow } from './BotEnvAddRow';
import { BotEnvRawEditor } from './BotEnvRawEditor';
import { BotEnvToolbar } from './BotEnvToolbar';
import { SettingsSection } from './SettingsSection';
import { buildSystemVars, READ_ONLY_KEYS } from './build-system-vars';
import { useEnvVariables } from './use-env-variables';
import type { useEnvPendingChanges } from './use-env-pending-changes';
import type { BotToken } from '@shared/schema';

/** Свойства панели переменных окружения */
interface BotEnvPanelProps {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Объект токена для системных переменных */
  token: BotToken;
  /** ID администраторов из проекта */
  adminIds: string;
  /** Общий pending state из BotCard */
  pending: ReturnType<typeof useEnvPendingChanges>;
}

/**
 * Панель переменных окружения бота с dirty state
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvPanel({ projectId, tokenId, token, adminIds, pending }: BotEnvPanelProps) {
  const { items, revealValue } = useEnvVariables(projectId, tokenId);

  /** Серверные переменные окружения (только ключи — значения не передаются) */
  const { data: serverEnvData } = useQuery<{ items: Array<{ key: string }> }>({
    queryKey: ['/api/server/env-keys'],
    queryFn: () => apiRequest('GET', '/api/server/env-keys'),
    staleTime: 5 * 60 * 1000,
  });

  /** Множество ключей серверных переменных (значения не передаются) */
  const serverEnvKeys = useMemo(() =>
    new Set((serverEnvData?.items ?? []).map(v => v.key)),
    [serverEnvData],
  );

  const [showAdd, setShowAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const systemVars = useMemo(
    () => buildSystemVars(token, projectId, tokenId, adminIds, items, serverEnvKeys),
    [token, projectId, tokenId, adminIds, items, serverEnvKeys],
  );

  /** Ключи системных переменных для фильтрации дублей */
  const systemKeys = useMemo(() => new Set(systemVars.map(v => v.key)), [systemVars]);

  const filteredSystem = useMemo(() =>
    systemVars.filter(v => v.key.includes(search.toUpperCase())), [systemVars, search]);

  /** Кастомные переменные без дублей с системными */
  const filteredCustom = useMemo(() =>
    items.filter(v => v.key.includes(search.toUpperCase()) && !systemKeys.has(v.key)),
    [items, search, systemKeys]);

  const totalCount = systemVars.length + filteredCustom.length;

  /** Обработчик pending изменения из BotEnvRow */
  function handlePendingChange(key: string, value: string, type: 'system' | 'custom', id?: number) {
    pending.addChange({ action: 'update', type, id, key, value });
  }

  /** Обработчик создания переменной (в pending) */
  function handleCreate(key: string, value: string, isSecret: number) {
    pending.addChange({ action: 'create', type: 'custom', key, value, isSecret });
    setShowAdd(false);
  }

  /** Обработчик удаления переменной (в pending) */
  function handleDelete(id: number) {
    const item = items.find(v => v.id === id);
    pending.addChange({ action: 'delete', type: 'custom', id, key: item?.key ?? '', value: '' });
  }

  return (
    <div className="@container space-y-4">
      <BotEnvToolbar
        totalCount={totalCount}
        showRaw={showRaw}
        showSearch={showSearch}
        search={search}
        onToggleRaw={() => setShowRaw(!showRaw)}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onAdd={() => setShowAdd(true)}
        onSearchChange={setSearch}
      />

      {showRaw ? (
        <BotEnvRawEditor
          systemVars={systemVars}
          customItems={filteredCustom.map(v => ({ id: v.id, key: v.key, value: v.value, isSecret: v.isSecret }))}
          onSystemUpdate={(key, value) => pending.addChange({ action: 'update', type: 'system', key, value })}
          onCreate={(key, value, isSecret) => handleCreate(key, value, isSecret)}
          onUpdate={(id, val) => pending.addChange({ action: 'update', type: 'custom', id, key: '', value: val })}
          onDelete={handleDelete}
          onClose={() => setShowRaw(false)}
        />
      ) : (
        <>
          {showAdd && (
            <BotEnvAddRow onSave={handleCreate} onCancel={() => setShowAdd(false)} />
          )}

          <SettingsSection title="Системные" count={filteredSystem.length}>
            {filteredSystem.map(v => (
              <BotEnvRow
                key={v.key} id={null} envKey={v.key} value={v.value}
                isSecret={v.isSecret} isSystem={true}
                isServerRef={v.isServerRef}
                onPendingChange={!READ_ONLY_KEYS.has(v.key) ? handlePendingChange : undefined}
                pendingValue={pending.getPendingValue(v.key)}
              />
            ))}
          </SettingsSection>

          {(filteredCustom.length > 0 || !showSearch) && (
            <SettingsSection title="Пользовательские" count={filteredCustom.length}>
              {filteredCustom.map(v => (
                <BotEnvRow
                  key={v.id} id={v.id} envKey={v.key} value={v.value}
                  isSecret={!!v.isSecret} isSystem={false}
                  onReveal={revealValue}
                  onPendingChange={handlePendingChange}
                  onDelete={handleDelete}
                  pendingValue={pending.getPendingValue(v.key)}
                />
              ))}
              {filteredCustom.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground/70">Нет пользовательских переменных</p>
              )}
            </SettingsSection>
          )}

        </>
      )}
    </div>
  );
}
