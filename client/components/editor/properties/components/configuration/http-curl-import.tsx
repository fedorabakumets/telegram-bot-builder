/**
 * @fileoverview Компонент импорта cURL команды для HTTP запроса
 * @module components/editor/properties/components/configuration/http-curl-import
 */
import { useState } from 'react';
import { Node } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Terminal } from 'lucide-react';
import { pairsToJson } from '../common/key-value-editor';

/** Пропсы компонента импорта cURL */
interface HttpCurlImportProps {
  /** Обработчик импорта — получает обновления данных узла */
  onImport: (updates: Partial<Node['data']>) => void;
}

/**
 * Парсит cURL команду и возвращает обновления данных узла
 * @param curl - строка cURL команды
 * @returns объект с обновлениями данных узла
 */
function parseCurl(curl: string): Partial<Node['data']> {
  const updates: Partial<Node['data']> = {};
  const tokens = curl.replace(/\\\n/g, ' ').match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

  /** Убирает кавычки с токена */
  const unquote = (s: string) => s.replace(/^['"]|['"]$/g, '');

  let method = 'GET';
  let url = '';
  const headers: Record<string, string> = {};
  const queryPairs: { key: string; value: string }[] = [];
  let body = '';

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'curl') continue;
    if (t === '-X' || t === '--request') {
      method = unquote(tokens[++i] || 'GET').toUpperCase();
    } else if (t === '-H' || t === '--header') {
      const raw = unquote(tokens[++i] || '');
      const sep = raw.indexOf(':');
      if (sep > 0) headers[raw.slice(0, sep).trim()] = raw.slice(sep + 1).trim();
    } else if (t === '-d' || t === '--data' || t === '--data-raw') {
      body = unquote(tokens[++i] || '');
    } else if (!t.startsWith('-') && !url) {
      url = unquote(t);
    }
  }

  // Извлекаем query params из URL
  try {
    const parsed = new URL(url);
    parsed.searchParams.forEach((v, k) => queryPairs.push({ key: k, value: v }));
    updates.httpRequestUrl = parsed.origin + parsed.pathname;
  } catch {
    updates.httpRequestUrl = url;
  }

  updates.httpRequestMethod = method as Node['data']['httpRequestMethod'];
  if (body) updates.httpRequestBody = body;
  if (Object.keys(headers).length) {
    updates.httpRequestHeaders = JSON.stringify(headers);
  }
  if (queryPairs.length) {
    updates.httpRequestQueryParams = pairsToJson(
      queryPairs.map((p, i) => ({ id: String(i), ...p }))
    );
  }

  return updates;
}

/**
 * Кнопка и диалог импорта cURL команды
 * @param props - свойства компонента
 * @returns JSX элемент
 */
export function HttpCurlImport({ onImport }: HttpCurlImportProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  /** Выполняет импорт и закрывает диалог */
  const handleImport = () => {
    if (!value.trim()) return;
    onImport(parseCurl(value.trim()));
    setValue('');
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Terminal className="h-3.5 w-3.5" />
        Import cURL
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Импорт cURL команды</DialogTitle>
          </DialogHeader>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={'curl -X POST https://api.example.com/data \\\n  -H "Content-Type: application/json" \\\n  -d \'{"key": "value"}\''}
            className="font-mono text-xs h-36 resize-none"
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleImport} disabled={!value.trim()}>
              Импортировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
