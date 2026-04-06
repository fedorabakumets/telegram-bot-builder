/**
 * @fileoverview Редактор аутентификации для HTTP запроса
 * @module components/editor/properties/components/configuration/http-auth-editor
 */
import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Пропсы компонента редактора аутентификации */
interface HttpAuthEditorProps {
  /** Данные узла */
  data: Node['data'];
  /** Обработчик обновления данных */
  onUpdate: (updates: Partial<Node['data']>) => void;
}

/** Типы аутентификации с метками */
const AUTH_TYPES = [
  { value: 'none', label: 'Без аутентификации' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'header', label: 'Header' },
  { value: 'query', label: 'Query Parameter' },
] as const;

/**
 * Компонент редактора аутентификации HTTP запроса
 * @param props - свойства компонента
 * @returns JSX элемент
 */
export function HttpAuthEditor({ data, onUpdate }: HttpAuthEditorProps) {
  const authType = (data.httpRequestAuthType as string) || 'none';

  return (
    <div className="space-y-2">
      <Select
        value={authType}
        onValueChange={(v) => onUpdate({ httpRequestAuthType: v as Node['data']['httpRequestAuthType'] })}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AUTH_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value} className="text-xs">
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {authType === 'bearer' && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Токен</Label>
          <Input
            value={(data.httpRequestAuthBearerToken as string) || ''}
            onChange={(e) => onUpdate({ httpRequestAuthBearerToken: e.target.value })}
            placeholder="Bearer токен"
            className="h-7 text-xs font-mono"
          />
        </div>
      )}

      {authType === 'basic' && (
        <div className="space-y-1.5">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Логин</Label>
            <Input
              value={(data.httpRequestAuthBasicUsername as string) || ''}
              onChange={(e) => onUpdate({ httpRequestAuthBasicUsername: e.target.value })}
              placeholder="username"
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Пароль</Label>
            <Input
              type="password"
              value={(data.httpRequestAuthBasicPassword as string) || ''}
              onChange={(e) => onUpdate({ httpRequestAuthBasicPassword: e.target.value })}
              placeholder="password"
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>
      )}

      {authType === 'header' && (
        <div className="space-y-1.5">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Имя заголовка</Label>
            <Input
              value={(data.httpRequestAuthHeaderName as string) || ''}
              onChange={(e) => onUpdate({ httpRequestAuthHeaderName: e.target.value })}
              placeholder="X-API-Key"
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Значение</Label>
            <Input
              value={(data.httpRequestAuthHeaderValue as string) || ''}
              onChange={(e) => onUpdate({ httpRequestAuthHeaderValue: e.target.value })}
              placeholder="значение заголовка"
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>
      )}

      {authType === 'query' && (
        <div className="space-y-1.5">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Имя параметра</Label>
            <Input
              value={(data.httpRequestAuthQueryName as string) || ''}
              onChange={(e) => onUpdate({ httpRequestAuthQueryName: e.target.value })}
              placeholder="api_key"
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Значение</Label>
            <Input
              value={(data.httpRequestAuthQueryValue as string) || ''}
              onChange={(e) => onUpdate({ httpRequestAuthQueryValue: e.target.value })}
              placeholder="значение параметра"
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
