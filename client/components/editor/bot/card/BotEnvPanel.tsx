/**
 * @fileoverview Панель переменных окружения бота (режим «Переменные»)
 * Отображает системные и пользовательские переменные с CRUD операциями
 * @module components/editor/bot/card/BotEnvPanel
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Search, Plus } from 'lucide-react';
import { BotEnvRow } from './BotEnvRow';
import { BotEnvAddRow } from './BotEnvAddRow';
import { useEnvVariables } from './use-env-variables';
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
}

/** Элемент системной переменной */
interface SystemVar {
  /** Имя переменной */
  key: string;
  /** Значение */
  value: string;
  /** Флаг секретности */
  isSecret: boolean;
}

/**
 * Формирует массив системных переменных из данных токена
 * @param token - Объект токена
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param adminIds - ID администраторов
 * @returns Массив системных переменных
 */
function buildSystemVars(token: BotToken, projectId: number, tokenId: number, adminIds: string): SystemVar[] {
  return [
    { key: 'BOT_TOKEN', value: token.token, isSecret: true },
    { key: 'ADMIN_IDS', value: adminIds || '123456789', isSecret: true },
    { key: 'PROJECT_ID', value: String(projectId), isSecret: false },
    { key: 'TOKEN_ID', value: String(tokenId), isSecret: false },
    { key: 'LOG_LEVEL', value: token.logLevel || 'WARNING', isSecret: false },
    { key: 'PROTECT_CONTENT', value: token.protectContent ? 'true' : 'false', isSecret: false },
    { key: 'SAVE_INCOMING_MEDIA', value: token.saveIncomingMedia ? 'true' : 'false', isSecret: false },
  ];
}

/**
 * Панель переменных окружения бота
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvPanel({ projectId, tokenId, token, adminIds }: BotEnvPanelProps) {
  const { items, createMutation, updateMutation, deleteMutation, revealValue } = useEnvVariables(projectId, tokenId);

  /** Показать форму добавления */
  const [showAdd, setShowAdd] = useState(false);
  /** Показать поиск */
  const [showSearch, setShowSearch] = useState(false);
  /** Строка поиска */
  const [search, setSearch] = useState('');

  /** Системные переменные */
  const systemVars = useMemo(() => buildSystemVars(token, projectId, tokenId, adminIds), [token, projectId, tokenId, adminIds]);

  /** Фильтрация по поиску */
  const filteredSystem = useMemo(() =>
    systemVars.filter(v => v.key.includes(search.toUpperCase())),
    [systemVars, search]
  );
  const filteredCustom = useMemo(() =>
    items.filter(v => v.key.includes(search.toUpperCase())),
    [items, search]
  );

  const totalCount = systemVars.length + items.length;

  /** Обработчик создания переменной */
  function handleCreate(key: string, value: string, isSecret: number) {
    createMutation.mutate({ key, value, isSecret }, { onSuccess: () => setShowAdd(false) });
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Заголовок */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground font-medium">
          {totalCount} переменных
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSearch(!showSearch)} title="Поиск">
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" /> Новая
          </Button>
        </div>
      </div>

      {/* Поиск */}
      {showSearch && (
        <Input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Фильтр по имени..." className="h-7 text-xs"
          autoFocus
        />
      )}

      {/* Форма добавления */}
      {showAdd && (
        <BotEnvAddRow
          onSave={handleCreate}
          onCancel={() => setShowAdd(false)}
          isPending={createMutation.isPending}
        />
      )}

      {/* Системные переменные */}
      <div className="space-y-0.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-2">
          Системные
        </span>
        {filteredSystem.map(v => (
          <BotEnvRow
            key={v.key} id={null} envKey={v.key} value={v.value}
            isSecret={v.isSecret} isSystem={true}
          />
        ))}
      </div>

      {/* Пользовательские переменные */}
      {(filteredCustom.length > 0 || !showSearch) && (
        <>
          <Separator className="opacity-30" />
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-2">
              Пользовательские
            </span>
            {filteredCustom.map(v => (
              <BotEnvRow
                key={v.id} id={v.id} envKey={v.key} value={v.value}
                isSecret={!!v.isSecret} isSystem={false}
                onReveal={revealValue}
                onUpdate={(id, val) => updateMutation.mutate({ id, value: val })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
            {filteredCustom.length === 0 && (
              <p className="text-xs text-muted-foreground/50 px-2 py-2">
                Нет пользовательских переменных
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
