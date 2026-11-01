/** @fileoverview Загрузка перетаскиваемых файлов в пределах панели с общей целью хранилища. */
import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Upload } from 'lucide-react';
import './file-drop-upload.css';
import { filesFromDataTransfer, httpUrlsFromDataTransfer } from '../../properties/media/files-from-data-transfer';
import { applyCompatibleDropEffect } from '../../properties/media/apply-compatible-drop-effect';
import { useToast } from '@/hooks/use-toast';

/** Параметры области перетаскивания. */
interface FileDropUploadProps {
  /** Поле загрузки для поиска своей панели, включая модальное окно. */
  inputRef: RefObject<HTMLInputElement>;
  /** Передать файлы общему обработчику загрузки. */
  onFiles: (files: File[]) => void;
  /** Не принимать новую пачку во время текущей загрузки. */
  disabled: boolean;
}

/**
 * Принимает только файлы и показывает подсказку поверх своей панели.
 * @param props - Поле, обработчик файлов и состояние загрузки
 * @returns Подсказка перетаскивания либо отсутствие элемента
 */
export function FileDropUpload({ inputRef, onFiles, disabled }: FileDropUploadProps) {
  const { toast } = useToast();
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const [dragging, setDragging] = useState(false);
  /** Видимая область панели сохраняется при прокрутке её содержимого. */
  const [bounds, setBounds] = useState<DOMRect | null>(null);
  useEffect(() => {
    const root = inputRef.current?.closest<HTMLElement>('[data-testid="file-storage-panel"]');
    if (!root) return;
    setPanel(root);
    let depth = 0;
    /** Принимает файлы и перенос без объявленных типов: внешнее приложение может раскрыть их лишь при сбросе. */
    const hasFiles = (event: DragEvent) => {
      const data = event.dataTransfer;
      if (!data) return false;
      const types = Array.from(data.types ?? []);
      return !types.length || types.some((type) => ['Files', 'text/uri-list', 'text/html'].includes(type))
        || Array.from(data?.items ?? []).some((item) => item.kind === 'file');
    };
    /** Учитывает вложенные элементы без мигания при перемещении между ними. */
    const enter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault(); depth += 1; setBounds(root.getBoundingClientRect()); setDragging(true);
    };
    /** Разрешает сброс файлов и задаёт курсор доступности загрузки. */
    const over = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) {
        if (disabled) event.dataTransfer.dropEffect = 'none';
        else applyCompatibleDropEffect(event.dataTransfer);
      }
    };
    /** Убирает подсказку только после выхода за границы всей панели. */
    const leave = () => { depth = Math.max(0, depth - 1); if (!depth) setDragging(false); };
    /** Передаёт пачку общей загрузке и предотвращает открытие файла браузером. */
    const drop = (event: DragEvent) => {
      if (!hasFiles(event) && !filesFromDataTransfer(event.dataTransfer).length && !httpUrlsFromDataTransfer(event.dataTransfer).length) return;
      event.preventDefault(); event.stopPropagation(); depth = 0; setDragging(false);
      const files = filesFromDataTransfer(event.dataTransfer);
      if (disabled) return;
      if (files.length) onFiles(files);
      else toast({ title: 'Приложение не передало доступный файл', description: 'Сохраните файл на устройство или скопируйте изображение и вставьте через «Из буфера».' });
    };
    /** Снимает подсветку после отмены перетаскивания. */
    const reset = () => { depth = 0; setDragging(false); };
    root.addEventListener('dragenter', enter); root.addEventListener('dragover', over, true);
    root.addEventListener('dragleave', leave); root.addEventListener('drop', drop, true);
    window.addEventListener('dragend', reset); window.addEventListener('blur', reset);
    return () => {
      root.removeEventListener('dragenter', enter); root.removeEventListener('dragover', over, true);
      root.removeEventListener('dragleave', leave); root.removeEventListener('drop', drop, true);
      window.removeEventListener('dragend', reset); window.removeEventListener('blur', reset);
    };
  }, [inputRef, onFiles, disabled]);
  return panel && dragging && bounds ? createPortal(<div className="files-drop-overlay" role="status"
    style={{ top: bounds.top + 8, left: bounds.left + 8, width: Math.max(0, bounds.width - 16), height: Math.max(0, bounds.height - 16) }}>
    <div><Upload className="h-8 w-8" aria-hidden="true" />
      <strong>{disabled ? 'Дождитесь завершения загрузки' : 'Отпустите файлы для загрузки'}</strong>
      <span>В выбранное хранилище проекта</span>
    </div>
  </div>, panel) : null;
}
