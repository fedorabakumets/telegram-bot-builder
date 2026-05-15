/**
 * @fileoverview Секция настройки подключения к БД для узла psql_query
 * Позволяет выбрать источник: серверная переменная, переменная бота или ручной ввод
 * @module components/editor/properties/components/configuration/psql-connection-section
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Unplug } from 'lucide-react';

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

      {/* Селектор источника */}
      <Select
        value={connectionSource}
        onValueChange={(value) => onUpdate({ connectionSource: value })}
      >
        <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="builtin">Серверная (DATABASE_URL)</SelectItem>
          <SelectItem value="env">Переменная бота</SelectItem>
          <SelectItem value="custom">Ввести вручную</SelectItem>
        </SelectContent>
      </Select>

      {/* Выбор env-переменной бота */}
      {connectionSource === 'env' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Переменная окружения бота
          </Label>
          {envVariables.length > 0 ? (
            <Select
              value={connectionEnvVar || ''}
              onValueChange={(value) => onUpdate({ connectionEnvVar: value })}
            >
              <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60">
                <SelectValue placeholder="Выберите переменную" />
              </SelectTrigger>
              <SelectContent>
                {envVariables.map((v) => (
                  <SelectItem key={v.key} value={v.key}>
                    {v.key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Нет переменных. Добавьте в настройках бота.
            </p>
          )}
        </div>
      )}

      {/* Ручной ввод connection string */}
      {connectionSource === 'custom' && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Connection String
          </Label>
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
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={handleParse}
            >
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
