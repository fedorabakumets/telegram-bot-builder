/** @fileoverview Подключение общего импорта сайдбара на экране первого проекта. */
import { useRef } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ImportDialog } from '../sidebar/components/import-dialog';
import { useSidebarImport } from '../sidebar/hooks/use-sidebar-import';
import { useSidebarImportHandler } from '../sidebar/hooks/use-sidebar-import-handler';
import { useSidebarFileUpload } from '../sidebar/hooks/use-sidebar-file-upload';

/**
 * Собирает существующие состояние, загрузку файлов и обработчик импорта редактора.
 * @returns Диалог и действие его открытия.
 */
export function useNoProjectsImport() {
  const state = useSidebarImport();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleFileUpload } = useSidebarFileUpload({
    setImportJsonText: state.setJsonText, setImportPythonText: state.setPythonText,
    setImportError: state.setError, toast,
  });
  const { handleImportProject } = useSidebarImportHandler({
    queryClient, toast, importState: state.importState,
    clearImport: state.clearImport, closeImportDialog: state.closeDialog,
    setImportError: state.setError, onProjectSelect: id => setLocation(`/editor/${id}`),
  });
  return {
    openImport: state.openDialog,
    importDialog: <ImportDialog isOpen={state.importState.isOpen} importState={state.importState}
      onOpenChange={open => open ? state.openDialog() : state.closeDialog()}
      onJsonTextChange={state.setJsonText} onPythonTextChange={state.setPythonText}
      onErrorChange={state.setError} onImport={handleImportProject}
      fileInputRef={fileInputRef}
      onFileUpload={handleFileUpload} />,
  };
}
