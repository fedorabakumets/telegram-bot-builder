/**
 * @fileoverview Секция настройки подключения к БД для узла psql_query
 * Единый селектор с группами: серверные переменные, переменные бота, ручной ввод
 * @module components/editor/properties/components/configuration/psql-connection-section
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Eye, EyeOff, Unplug, Server, Bot, Pencil } from 'lucide-react';

/** Тип источника подключения */
type ConnectionSource = 'builtin' | 'env' | 'custom';

/** Разобранные поля connection string */
interface ParsedConnection {
  /** Хост БД */
  host: string;
  /** Порт */
  port: string;
  /** Имя пользователя */
  user: string;
  /** Пароль */
  password: string;
  /** Имя базы данных */
  database: string;
  /** Использовать SSL */
  ssl: boolean;
}

/** Пропсы компонента PsqlConnectionSection */
interface PsqlConnectionSectionProps {
  /** Текущий источник подключения */
  connectionSource: ConnectionSource;
  /** Имя env-переменной бота */
  connectionEnvVar: string;
  /** Connection string для ручного ввода */
  connectionString: string;
  /** Список env-переменных бота */
  envVariables: Array<{ key: string; value: string }>;
  /** Функция обновления данных узла */
  onUpdate: (updates: Record<string, any>) => void;
}

/** Серверные переменные (доступны всегда) */
const SERVER_VARIABLES = [
  { key: 'DATABASE_URL', description: 'Основная PostgreSQL БД платформы' },
  { key: 'REDIS_URL', description: 'Redis для кэша и FSM' },
];

/**
 * Парсит connection string в отдельные поля
 * @param url - PostgreSQL connection string
 * @returns Разобранные поля подключения
 */
function parseConnectionString(url: string): ParsedConnection | null {
  try {
    const match = url.match(
      /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/([^?]+)?\??(.*)$/
    );
    if (!match) return null;
    const [, user, password, host, port, database, params] = match;
    const ssl = params?.includes('sslmode=require') || params?.includes('ssl=true') || false;
    return { host, port: port || '5432', user, password, database: database || '', ssl };
  } catch {
    return null;
  }
}

/**
 * Собирает connection string из отдельных полей
 * @param fields - Поля подключения
 * @returns Connection string
 */
function buildConnectionString(fields: ParsedConnection): string {
  const base = `postgresql://${fields.user}:${fields.password}@${fields.host}:${fields.port}/${fields.database}`;
  return fields.ssl ? `${base}?sslmode=require` : base;
}

/**
 * Возвращает отображаемое название текущего подключения
 * @param source - Источник подключения
 * @param envVar - Имя env-переменной
 * @returns Строка для отображения
 */
function getDisplayLabel(source: ConnectionSource, envVar: string): string {
  if (source === 'builtin') return 'DATABASE_URL';
  if (source === 'env') return envVar || 'Выберите переменную';
  return 'Ручной ввод';
}

/**
 * Секция настройки подключения к БД
 * @param props - Пропсы компонента
 * @returns JSX элемент секции подключения
 */
export function PsqlConnectionSection({
  connectionSource,
  connectionEnvVar,
  connectionString,
  envVariables,
  onUpdate,
}: PsqlConnectionSectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const [parsedFields, setParsedFields] = useState<ParsedConnection | null>(null);

  /** Обработчик выбора серверной переменной */
  const handleSelectServer = (key: string) => {
    onUpdate({ connectionSource: 'builtin', connectionEnvVar: key, connectionString: '' });
    setShowFields(false);
  };

  /** Обработчик выбора переменной бота */
  const handleSelectBotEnv = (key: string) => {
    onUpdate({ connectionSource: 'env', connectionEnvVar: key, connectionString: '' });
    setShowFields(false);
  };

  /** Обработчик выбора ручного ввода */
  const handleSelectCustom = () => {
    onUpdate({ connectionSource: 'custom', connectionEnvVar: '' });
  };

  /** Обработчик разбора URL */
  const handleParse = () => {
    const parsed = parseConnectionString(connectionString);
    if (parsed) {
      setParsedFields(parsed);
      setShowFields(true);
    }
  };

  /** Обработчик изменения отдельного поля */
  const handleFieldChange = (field: keyof ParsedConnection, value: string | boolean) => {
    if (!parsedFields) return;
    const updated = { ...parsedFields, [field]: value };
    setParsedFields(updated);
    onUpdate({ connectionString: buildConnectionString(updated) });
  };

  return (
    <div className="space-y-3 p-3 rounded-lg bg-gradient-to-br from-violet-50/60 to-purple-50/40 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200/40 dark:border-violet-700/40">
      {/* Заголовок */}
      <Label className="text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
        <Unplug className="w-3.5 h-3.5" />
        Подключение к БД
      </Label>

      {/* Dropdown-селектор в стиле VariableSelector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 justify-between text-xs font-mono bg-white/60 dark:bg-slate-950/60 border-violet-300/40 dark:border-violet-700/40"
          >
            <span className="truncate">{getDisplayLabel(connectionSource, connectionEnvVar)}</span>
            <ChevronDown className="h-3.5 w-3.5 ml-2 flex-shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {/* Серверные переменные */}
          <DropdownMenuLabel className="text-xs font-semibold flex items-center gap-1.5">
            <Server className="w-3 h-3" />
            Серверные
          </DropdownMenuLabel>
          {SERVER_VARIABLES.map((v) => (
            <DropdownMenuItem
              key={v.key}
              onClick={() => handleSelectServer(v.key)}
              className="cursor-pointer"
            >
              <div className="flex flex-col gap-0.5">
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {v.key}
                </code>
                <span className="text-[10px] text-muted-foreground">{v.description}</span>
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {/* Переменные бота */}
          <DropdownMenuLabel className="text-xs font-semibold flex items-center gap-1.5">
            <Bot className="w-3 h-3" />
            Переменные бота
          </DropdownMenuLabel>
          {envVariables.length > 0 ? (
            envVariables.map((v) => (
              <DropdownMenuItem
                key={v.key}
                onClick={() => handleSelectBotEnv(v.key)}
                className="cursor-pointer"
              >
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {v.key}
                </code>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-3 py-2 text-[10px] text-muted-foreground italic">
              Нет переменных. Добавьте во вкладке «Бот».
            </div>
          )}

          <DropdownMenuSeparator />

          {/* Ручной ввод */}
          <DropdownMenuItem onClick={handleSelectCustom} className="cursor-pointer">
            <div className="flex items-center gap-1.5">
              <Pencil className="w-3 h-3" />
              <span className="text-xs font-medium">Ввести вручную</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Поле ручного ввода connection string */}
      {connectionSource === 'custom' && (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={connectionString}
              onChange={(e) => {
                onUpdate({ connectionString: e.target.value });
                setShowFields(false);
                setParsedFields(null);
              }}
              placeholder="postgresql://user:pass@host:5432/dbname"
              className="text-xs h-8 font-mono bg-white/60 dark:bg-slate-950/60 flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Скрыть' : 'Показать'}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* Кнопка разбора */}
          {connectionString && !showFields && (
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleParse}>
              Разобрать URL
            </Button>
          )}

          {/* Разобранные поля */}
          {showFields && parsedFields && (
            <div className="space-y-2 p-2 rounded-md bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Host</Label>
                  <Input
                    value={parsedFields.host}
                    onChange={(e) => handleFieldChange('host', e.target.value)}
                    className="text-xs h-7 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Port</Label>
                  <Input
                    value={parsedFields.port}
                    onChange={(e) => handleFieldChange('port', e.target.value)}
                    className="text-xs h-7 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">User</Label>
                  <Input
                    value={parsedFields.user}
                    onChange={(e) => handleFieldChange('user', e.target.value)}
                    className="text-xs h-7 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Password</Label>
                  <Input
                    type="password"
                    value={parsedFields.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    className="text-xs h-7 font-mono"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Database</Label>
                <Input
                  value={parsedFields.database}
                  onChange={(e) => handleFieldChange('database', e.target.value)}
                  className="text-xs h-7 font-mono"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parsedFields.ssl}
                  onChange={(e) => handleFieldChange('ssl', e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-xs text-muted-foreground">SSL (sslmode=require)</span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
