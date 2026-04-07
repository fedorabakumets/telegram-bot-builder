/**
 * @fileoverview Панель свойств узла HTTP запроса — полная конфигурация
 * @module components/editor/properties/components/configuration/http-request-configuration
 */
import React from 'react';
import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { KeyValueEditor, jsonToPairs, pairsToJson } from '../common/key-value-editor';
import { HttpAuthEditor } from './http-auth-editor';
import { HttpCurlImport } from './http-curl-import';

/** Доступные HTTP методы */
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

/**
 * Обёртка секции с отступами
 * @param props - дочерние элементы
 * @returns JSX элемент
 */
function Section({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-3">{children}</div>;
}

/**
 * Заголовок секции
 * @param props - дочерние элементы
 * @returns JSX элемент
 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-foreground mb-2">{children}</p>;
}

/** Пропсы чекбокса с подписью */
interface CheckOptionProps {
  /** Идентификатор */
  id: string;
  /** Подпись */
  label: string;
  /** Состояние */
  checked: boolean;
  /** Обработчик изменения */
  onCheckedChange: (v: boolean) => void;
}

/**
 * Чекбокс с подписью
 * @param props - свойства компонента
 * @returns JSX элемент
 */
function CheckOption({ id, label, checked, onCheckedChange }: CheckOptionProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(!!v)}
        className="h-3.5 w-3.5"
      />
      <Label htmlFor={id} className="text-xs text-muted-foreground cursor-pointer">{label}</Label>
    </div>
  );
}

/** Пропсы компонента настройки HTTP запроса */
interface HttpRequestConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Конвертирует JSON объект заголовков в массив пар
 * @param raw - JSON строка заголовков
 * @returns массив пар ключ-значение
 */
function headersToPairs(raw: string | undefined) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([key, value], i) => ({
        id: String(i),
        key,
        value: String(value),
      }));
    }
  } catch { /* невалидный JSON */ }
  return jsonToPairs(raw);
}

/**
 * Конвертирует массив пар в JSON объект заголовков
 * @param pairs - массив пар ключ-значение
 * @returns JSON строка объекта
 */
function pairsToHeaders(pairs: ReturnType<typeof headersToPairs>): string {
  if (!pairs.length) return '';
  const obj = Object.fromEntries(pairs.map((p) => [p.key, p.value]));
  return JSON.stringify(obj);
}

/**
 * Компонент настройки узла HTTP запроса
 * @param props - свойства компонента
 * @returns JSX элемент
 */
export function HttpRequestConfiguration({ selectedNode, onNodeUpdate }: HttpRequestConfigurationProps) {
  const data = selectedNode.data;
  const method = (data.httpRequestMethod as string) || 'GET';
  const showBody = method === 'POST' || method === 'PUT' || method === 'PATCH';

  /** Обновляет данные узла */
  const upd = (updates: Partial<Node['data']>) => onNodeUpdate(selectedNode.id, updates);

  return (
    <div className="space-y-0 divide-y divide-border">
      <Section>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Запрос</SectionLabel>
          <HttpCurlImport onImport={upd} />
        </div>
        <div className="flex gap-1.5">
          <Select
            value={method}
            onValueChange={(v) => upd({ httpRequestMethod: v as Node['data']['httpRequestMethod'] })}
          >
            <SelectTrigger className="w-24 h-8 text-xs font-mono font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map((m) => (
                <SelectItem key={m} value={m} className="text-xs font-mono font-bold">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="https://api.example.com/endpoint"
            value={(data.httpRequestUrl as string) || ''}
            onChange={(e) => upd({ httpRequestUrl: e.target.value })}
            className="flex-1 h-8 font-mono text-xs"
          />
        </div>
      </Section>

      <Section>
        <SectionLabel>Query параметры</SectionLabel>
        <KeyValueEditor
          pairs={jsonToPairs((data.httpRequestQueryParams as string) || '')}
          onChange={(pairs) => upd({ httpRequestQueryParams: pairsToJson(pairs) })}
          keyPlaceholder="param"
          valuePlaceholder="значение"
        />
      </Section>

      <Section>
        <SectionLabel>Аутентификация</SectionLabel>
        <HttpAuthEditor data={data} onUpdate={upd} />
      </Section>

      <Section>
        <SectionLabel>Заголовки</SectionLabel>
        <KeyValueEditor
          pairs={headersToPairs(data.httpRequestHeaders as string | undefined)}
          onChange={(pairs) => upd({ httpRequestHeaders: pairsToHeaders(pairs) })}
          keyPlaceholder="Content-Type"
          valuePlaceholder="application/json"
        />
      </Section>

      {showBody && (
        <Section>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Тело запроса</SectionLabel>
            <Select
              value={(data.httpRequestBodyFormat as string) || 'json'}
              onValueChange={(v) => upd({ httpRequestBodyFormat: v as Node['data']['httpRequestBodyFormat'] })}
            >
              <SelectTrigger className="h-6 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json" className="text-xs">JSON</SelectItem>
                <SelectItem value="form-urlencoded" className="text-xs">Form URL-encoded</SelectItem>
                <SelectItem value="raw" className="text-xs">Raw</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder={'{"key": "{variable}"}'}
            value={(data.httpRequestBody as string) || ''}
            onChange={(e) => upd({ httpRequestBody: e.target.value })}
            className="font-mono text-xs h-24 resize-none"
          />
        </Section>
      )}

      <Section>
        <SectionLabel>Ответ</SectionLabel>
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Label className="text-xs text-muted-foreground w-24 shrink-0">Переменная</Label>
            <Input
              placeholder="response"
              value={(data.httpRequestResponseVariable as string) || ''}
              onChange={(e) => upd({ httpRequestResponseVariable: e.target.value })}
              className="h-7 font-mono text-xs flex-1"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Label className="text-xs text-muted-foreground w-24 shrink-0">Формат</Label>
            <Select
              value={(data.httpRequestResponseFormat as string) || 'autodetect'}
              onValueChange={(v) => upd({ httpRequestResponseFormat: v as Node['data']['httpRequestResponseFormat'] })}
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="autodetect" className="text-xs">Автоопределение</SelectItem>
                <SelectItem value="json" className="text-xs">JSON</SelectItem>
                <SelectItem value="text" className="text-xs">Текст</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section>
        <SectionLabel>Статус код (опционально)</SectionLabel>
        <Input
          placeholder="status_code"
          value={(data.httpRequestStatusVariable as string) || ''}
          onChange={(e) => upd({ httpRequestStatusVariable: e.target.value })}
          className="h-7 font-mono text-xs"
        />
      </Section>

      <Section>
        <SectionLabel>Таймаут (секунды)</SectionLabel>
        <Input
          type="number"
          min={1}
          max={300}
          value={(data.httpRequestTimeout as number) ?? 30}
          onChange={(e) => upd({ httpRequestTimeout: parseInt(e.target.value) || 30 })}
          className="h-7 w-24 text-xs"
        />
      </Section>

      <Section>
        <SectionLabel>Опции</SectionLabel>
        <div className="space-y-2">
          <CheckOption
            id="ignoreErrors"
            label="Игнорировать HTTP ошибки (4xx, 5xx)"
            checked={!!(data.httpRequestIgnoreHttpErrors)}
            onCheckedChange={(v) => upd({ httpRequestIgnoreHttpErrors: v })}
          />
          <CheckOption
            id="ignoreSsl"
            label="Игнорировать SSL сертификат"
            checked={!!(data.httpRequestIgnoreSsl)}
            onCheckedChange={(v) => upd({ httpRequestIgnoreSsl: v })}
          />
          <CheckOption
            id="followRedirects"
            label="Следовать редиректам"
            checked={data.httpRequestFollowRedirects !== false}
            onCheckedChange={(v) => upd({ httpRequestFollowRedirects: v })}
          />
        </div>
      </Section>
    </div>
  );
}
