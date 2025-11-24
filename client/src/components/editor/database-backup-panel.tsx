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
    <div className="space-y-4">
      {/* Заголовок и кнопки действий */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Резервные копии
          </h3>
          <p className="text-sm text-muted-foreground">
            Управление резервными копиями базы данных
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Создать
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
              <Button size="sm" variant="outline">
                <Upload className="w-4 h-4 mr-1" />
                Загрузить
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

      {/* Справка и инструкции */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 space-y-3">
        <div className="flex gap-3">
          <div className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Как пользоваться резервными копиями</h4>
            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
              <div className="flex gap-2">
                <span className="font-medium min-w-fit">📦 Создать:</span>
                <span>Нажмите кнопку "Создать" чтобы сохранить полную копию текущего состояния базы данных</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium min-w-fit">📤 Загрузить:</span>
                <span>Загрузите ранее сохраненную копию из файла и восстановите данные</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium min-w-fit">⬇️ Скачать:</span>
                <span>Нажмите на иконку скачивания рядом с копией чтобы экспортировать её</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium min-w-fit">↩️ Восстановить:</span>
                <span>Нажмите на иконку обновления чтобы восстановить данные из выбранной копии</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium min-w-fit">🗑️ Удалить:</span>
                <span>Нажмите на иконку удаления чтобы убрать ненужную резервную копию</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика базы данных */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4" />
            Статистика базы данных
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Загрузка статистики...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.totalRecords.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Записи</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.tables.length}</div>
                  <div className="text-xs text-muted-foreground">Таблицы</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.estimatedSize}</div>
                  <div className="text-xs text-muted-foreground">Размер</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Таблицы:</div>
                <div className="space-y-1">
                  {stats.tables.map((table, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{table.name}</span>
                      </div>
                      <span className="text-muted-foreground">{table.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Список резервных копий */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Archive className="w-4 h-4" />
            Список резервных копий ({backups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupsLoading ? (
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Загрузка списка резервных копий...
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Резервные копии не найдены</p>
              <p className="text-xs">Создайте первую резервную копию</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{backup.filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {backup.metadata?.version || 'v1.0.0'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(backup.created).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {formatFileSize(backup.size)}
                          </div>
                        </div>
                        {backup.metadata?.description && (
                          <p className="text-xs truncate">{backup.metadata.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadBackup(backup.filename)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <RefreshCw className="w-3 h-3" />
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
                        onClick={() => deleteBackupMutation.mutate(backup.filename)}
                        disabled={deleteBackupMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
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