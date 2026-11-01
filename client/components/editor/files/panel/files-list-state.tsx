/**
 * @fileoverview Состояния загрузки, ошибки и пустой выборки файлов проекта.
 */
import { FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Свойства состояния списка файлов. */
interface FilesListStateProps {
  /** Выполняется ли начальная загрузка. */
  loading: boolean;
  /** Не удалось ли загрузить файлы. */
  error: boolean;
  /** Выбрана категория, бот или дополнительные фильтры. */
  filtered: boolean;
  /** Есть ли дополнительные фильтры для сброса. */
  canReset: boolean;
  /** Повторная загрузка файлов. */
  onRetry: () => void;
  /** Сброс дополнительных фильтров. */
  onReset: () => void;
}

/**
 * Объясняет пустую выборку и предлагает доступный следующий шаг.
 * @param props - Состояние загрузки и обработчики повторной попытки и сброса.
 * @returns Пустое состояние, ошибка или каркас загрузки.
 */
export function FilesListState({ loading, error, filtered, canReset, onRetry, onReset }: FilesListStateProps) {
  if (loading) return <div role="status" className="space-y-3 p-4">
    <span className="sr-only">Загрузка файлов…</span>
    {[0, 1, 2].map((index) => <div key={index} aria-hidden="true" className="files-inset h-16 rounded-lg" />)}
  </div>;
  return <div className="flex min-h-48 h-full flex-col items-center justify-center gap-3 p-6 text-center" role={error ? 'alert' : 'status'}>
    <div className="files-inset flex h-12 w-12 items-center justify-center rounded-xl text-muted-foreground"><FileImage className="h-6 w-6" aria-hidden="true" /></div>
    <h3 className="text-balance text-lg font-semibold">{error ? 'Не удалось загрузить файлы' : filtered ? 'В этой выборке пока нет файлов' : 'Добавьте первый файл'}</h3>
    <p className="max-w-md text-pretty text-sm text-muted-foreground">
      {error ? 'Проверьте соединение и повторите загрузку списка.' : filtered
        ? 'Выберите другую категорию, бота или измените фильтры.'
        : 'Нажмите «Загрузить», чтобы добавить файл с устройства. Изображения можно вставить из буфера обмена.'}
    </p>
    {error && <Button variant="outline" onClick={onRetry} className="files-action px-3">Повторить загрузку</Button>}
    {!error && canReset && <Button variant="outline" onClick={onReset} className="files-action px-3">Сбросить фильтры</Button>}
  </div>;
}
