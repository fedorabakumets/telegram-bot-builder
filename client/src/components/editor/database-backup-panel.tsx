import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Download, 
  Upload, 
  Database, 
  Shield, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Calendar, 
  HardDrive, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Archive,
  CloudDownload,
  Plus
} from 'lucide-react';

interface BackupFile {
  filename: string;
  filepath: string;
  size: number;
  created: Date;
  metadata?: {
    version: string;
    timestamp: string;
    description?: string;
    tables: string[];
  };
}

interface DatabaseStats {
  tables: Array<{
    name: string;
    count: number;
    size: string;
  }>;
  totalRecords: number;
  estimatedSize: string;
}

export function DatabaseBackupPanel() {
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [restoreImmediately, setRestoreImmediately] = useState(false);
  const [clearExisting, setClearExisting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // Получить список резервных копий
  const { data: backupsData, isLoading: backupsLoading } = useQuery({
    queryKey: ['database/backups'],
    queryFn: () => apiRequest('GET', '/api/database/backups'),
    staleTime: 30000
  });

  // Получить статистику базы данных
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['database/stats'],
    queryFn: () => apiRequest('GET', '/api/database/stats/detailed'),
    staleTime: 60000
  });

  // Мутация для создания резервной копии
  const createBackupMutation = useMutation({
    mutationFn: (description: string) => 
      apiRequest('POST', '/api/database/backup', { description }),
    onSuccess: () => {
      toast({
        title: "Резервная копия создана",
        description: "Резервная копия базы данных создана успешно"
      });
      queryClient.invalidateQueries({ queryKey: ['database/backups'] });
      setNewBackupDescription('');
      setShowBackupDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка создания резервной копии",
        description: error.message || "Не удалось создать резервную копию",
        variant: "destructive"
      });
    }
  });

  // Мутация для восстановления из резервной копии
  const restoreBackupMutation = useMutation({
    mutationFn: ({ filename, options }: { filename: string; options: any }) => 
      apiRequest('POST', '/api/database/restore', { filename, options }),
    onSuccess: () => {
      toast({
        title: "База данных восстановлена",
        description: "База данных успешно восстановлена из резервной копии"
      });
      queryClient.invalidateQueries({ queryKey: ['database/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка восстановления",
        description: error.message || "Не удалось восстановить базу данных",
        variant: "destructive"
      });
    }
  });

  // Мутация для удаления резервной копии
  const deleteBackupMutation = useMutation({
    mutationFn: (filename: string) => 
      apiRequest('DELETE', `/api/database/backup/${filename}`),
    onSuccess: () => {
      toast({
        title: "Резервная копия удалена",
        description: "Резервная копия успешно удалена"
      });
      queryClient.invalidateQueries({ queryKey: ['database/backups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить резервную копию",
        variant: "destructive"
      });
    }
  });

  // Обработчик загрузки файла
  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('backup', uploadFile);
      formData.append('restoreImmediately', restoreImmediately.toString());
      formData.append('clearExisting', clearExisting.toString());

      const response = await fetch('/api/database/backup/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Файл загружен",
          description: result.message
        });
        queryClient.invalidateQueries({ queryKey: ['database/backups'] });
        if (result.restored) {
          queryClient.invalidateQueries({ queryKey: ['database/stats'] });
        }
        setShowUploadDialog(false);
      } else {
        throw new Error(result.error || 'Не удалось загрузить файл');
      }
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить файл",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadFile(null);
    }
  };

  // Обработчик скачивания резервной копии
  const handleDownloadBackup = (filename: string) => {
    const downloadUrl = `/api/database/backup/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Форматирование размера файла
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const backups: BackupFile[] = backupsData?.backups || [];
  const stats: DatabaseStats = statsData?.stats || { tables: [], totalRecords: 0, estimatedSize: 'N/A' };

  return (
    <div className="space-y-2.5 xs:space-y-3 sm:space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col xs:flex-row xs:items-start gap-2.5 xs:gap-3 xs:justify-between">
        <div className="flex items-start gap-2 xs:gap-2.5 flex-1 min-w-0">
          <div className="w-7 xs:w-8 h-7 xs:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40">
            <Archive className="w-4 xs:w-4.5 h-4 xs:h-4.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm xs:text-base sm:text-lg font-bold text-foreground leading-tight">Резервные копии</h3>
            <p className="text-xs xs:text-sm text-muted-foreground mt-0.5 break-words">Управление резервными копиями базы данных</p>
          </div>
        </div>
        <div className="flex gap-1.5 xs:gap-2 flex-shrink-0">
          <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 xs:h-9 px-2 xs:px-3 text-xs xs:text-sm">
                <Plus className="w-3 xs:w-3.5 h-3 xs:h-3.5 flex-shrink-0" />
                <span className="hidden xs:inline ml-1">Создать</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать резервную копию</DialogTitle>
                <DialogDescription>
                  Создание полной резервной копии базы данных
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-description">Описание резервной копии</Label>
                  <Textarea
                    id="backup-description"
                    placeholder="Опишите цель создания резервной копии..."
                    value={newBackupDescription}
                    onChange={(e) => setNewBackupDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={() => createBackupMutation.mutate(newBackupDescription)}
                  disabled={createBackupMutation.isPending}
                  className="w-full"
                >
                  {createBackupMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Archive className="w-4 h-4 mr-2" />
                  )}
                  Создать резервную копию
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 xs:h-9 px-2 xs:px-3 text-xs xs:text-sm">
                <Upload className="w-3 xs:w-3.5 h-3 xs:h-3.5 flex-shrink-0" />
                <span className="hidden xs:inline ml-1">Загрузить</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Загрузить резервную копию</DialogTitle>
                <DialogDescription>
                  Загрузка резервной копии из файла
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-file">Выберите файл резервной копии</Label>
                  <Input
                    id="backup-file"
                    type="file"
                    accept=".json"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="restore-immediately"
                      checked={restoreImmediately}
                      onCheckedChange={setRestoreImmediately}
                    />
                    <Label htmlFor="restore-immediately">Восстановить немедленно</Label>
                  </div>
                  
                  {restoreImmediately && (
                    <div className="flex items-center space-x-2 ml-6">
                      <Switch
                        id="clear-existing"
                        checked={clearExisting}
                        onCheckedChange={setClearExisting}
                      />
                      <Label htmlFor="clear-existing">Очистить существующие данные</Label>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleFileUpload}
                  disabled={!uploadFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CloudDownload className="w-4 h-4 mr-2" />
                  )}
                  Загрузить файл
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Guide */}
      <div className="rounded-lg border border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 xs:p-3 sm:p-4 space-y-2.5 xs:space-y-3 max-h-32 xs:max-h-40 sm:max-h-48 overflow-y-auto">
        <div className="flex gap-2 xs:gap-3">
          <div className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
            <svg className="w-4 xs:w-5 h-4 xs:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="space-y-1.5 xs:space-y-2 flex-1 min-w-0">
            <h4 className="text-xs xs:text-sm font-bold text-blue-900 dark:text-blue-100">Как пользоваться резервными копиями</h4>
            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1 xs:space-y-1.5">
              <div className="flex gap-2">
                <span className="font-semibold min-w-fit">📦 Создать:</span>
                <span className="break-words">Сохраните полную копию текущего состояния БД</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-fit">📤 Загрузить:</span>
                <span className="break-words">Восстановите данные из файла</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-fit">⬇️ Скачать:</span>
                <span className="break-words">Экспортируйте копию в файл</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-fit">↩️ Восстановить:</span>
                <span className="break-words">Вернитесь к предыдущему состоянию</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-fit">🗑️ Удалить:</span>
                <span className="break-words">Удалите ненужную копию</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Stats */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="pb-3 xs:pb-4 sm:pb-5">
          <CardTitle className="flex items-center gap-2 text-xs xs:text-sm font-semibold">
            <BarChart3 className="w-3.5 xs:w-4 h-3.5 xs:h-4" />
            Статистика
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center gap-2 text-xs xs:text-sm">
              <RefreshCw className="w-3.5 xs:w-4 h-3.5 xs:h-4 animate-spin" />
              Загрузка...
            </div>
          ) : (
            <div className="space-y-2.5 xs:space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5 xs:gap-2">
                <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-md p-2 xs:p-2.5 text-center">
                  <div className="text-sm xs:text-base font-bold text-blue-600 dark:text-blue-400">{stats.totalRecords.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Записи</div>
                </div>
                <div className="bg-green-50/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50 rounded-md p-2 xs:p-2.5 text-center">
                  <div className="text-sm xs:text-base font-bold text-green-600 dark:text-green-400">{stats.tables.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Таблицы</div>
                </div>
                <div className="bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/50 rounded-md p-2 xs:p-2.5 text-center">
                  <div className="text-sm xs:text-base font-bold text-purple-600 dark:text-purple-400">{stats.estimatedSize}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Размер</div>
                </div>
              </div>
              
              <Separator className="my-2 xs:my-3" />
              
              <div className="space-y-1.5 xs:space-y-2">
                <div className="text-xs xs:text-sm font-semibold text-foreground">Таблицы:</div>
                <div className="space-y-0.5 xs:space-y-1">
                  {stats.tables.map((table, index) => (
                    <div key={index} className="flex items-center justify-between text-xs xs:text-sm p-1.5 xs:p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate">{table.name}</span>
                      </div>
                      <span className="text-muted-foreground ml-2 flex-shrink-0">{table.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="pb-3 xs:pb-4 sm:pb-5">
          <CardTitle className="flex items-center gap-2 text-xs xs:text-sm font-semibold">
            <Archive className="w-3.5 xs:w-4 h-3.5 xs:h-4" />
            Резервные копии<Badge variant="secondary" className="ml-2 text-xs">{backups.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupsLoading ? (
            <div className="flex items-center gap-2 text-xs xs:text-sm">
              <RefreshCw className="w-3.5 xs:w-4 h-3.5 xs:h-4 animate-spin" />
              Загрузка...
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-4 xs:py-6 sm:py-8 text-muted-foreground">
              <Archive className="w-6 xs:w-8 h-6 xs:h-8 mx-auto mb-1.5 xs:mb-2 opacity-50" />
              <p className="text-xs xs:text-sm font-medium">Резервные копии не найдены</p>
              <p className="text-xs text-muted-foreground mt-0.5 xs:mt-1">Создайте первую копию</p>
            </div>
          ) : (
            <div className="space-y-1.5 xs:space-y-2 sm:space-y-2.5">
              {backups.map((backup, index) => (
                <div key={index} className="p-2 xs:p-2.5 sm:p-3 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 xs:gap-2 mb-1 xs:mb-1.5 min-w-0">
                        <FileText className="w-3 xs:w-3.5 h-3 xs:h-3.5 flex-shrink-0 text-muted-foreground" />
                        <span className="text-xs xs:text-sm font-medium truncate">{backup.filename}</span>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {backup.metadata?.version || 'v1'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5 xs:space-y-1">
                        <div className="flex items-center gap-2 xs:gap-3 flex-wrap">
                          <div className="flex items-center gap-0.5 xs:gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{new Date(backup.created).toLocaleDateString('ru-RU')}</span>
                          </div>
                          <div className="flex items-center gap-0.5 xs:gap-1">
                            <HardDrive className="w-3 h-3 flex-shrink-0" />
                            <span>{formatFileSize(backup.size)}</span>
                          </div>
                        </div>
                        {backup.metadata?.description && (
                          <p className="text-xs truncate">{backup.metadata.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 xs:gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 xs:h-8 w-7 xs:w-8 p-0"
                        onClick={() => handleDownloadBackup(backup.filename)}
                        title="Скачать"
                      >
                        <Download className="w-3 xs:w-3.5 h-3 xs:h-3.5" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 xs:h-8 w-7 xs:w-8 p-0" title="Восстановить">
                            <RefreshCw className="w-3 xs:w-3.5 h-3 xs:h-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Восстановить базу данных</DialogTitle>
                            <DialogDescription>
                              Восстановление из резервной копии {backup.filename}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="restore-clear"
                                checked={clearExisting}
                                onCheckedChange={setClearExisting}
                              />
                              <Label htmlFor="restore-clear">Очистить существующие данные</Label>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              <span className="text-sm">
                                Эта операция изменит текущие данные в базе
                              </span>
                            </div>
                            <Button
                              onClick={() => restoreBackupMutation.mutate({ 
                                filename: backup.filename, 
                                options: { clearExisting } 
                              })}
                              disabled={restoreBackupMutation.isPending}
                              className="w-full"
                            >
                              {restoreBackupMutation.isPending ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Восстановить
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 xs:h-8 w-7 xs:w-8 p-0"
                        onClick={() => deleteBackupMutation.mutate(backup.filename)}
                        disabled={deleteBackupMutation.isPending}
                        title="Удалить"
                      >
                        <Trash2 className="w-3 xs:w-3.5 h-3 xs:h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}