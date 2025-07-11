import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
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
  Clock,
  Settings,
  Archive,
  CloudDownload,
  Plus,
  ArrowLeft,
  Home
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

export default function DatabaseManager() {
  const [, navigate] = useLocation();
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [restoreImmediately, setRestoreImmediately] = useState(false);
  const [clearExisting, setClearExisting] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Заголовок с навигацией */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к редактору
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Database className="w-8 h-8" />
                Управление базой данных
              </h1>
              <p className="text-muted-foreground mt-1">
                Создание резервных копий, восстановление и мониторинг базы данных
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries()}
              disabled={backupsLoading || statsLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${backupsLoading || statsLoading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
            <Badge variant="secondary" className="text-sm">
              <Shield className="w-4 h-4 mr-1" />
              Безопасность данных
            </Badge>
          </div>
        </div>

        {/* Быстрые действия с базой данных */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Database className="w-5 h-5" />
              Быстрые действия
            </CardTitle>
            <CardDescription>
              Экспорт и импорт всей базы данных одним файлом
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Экспорт базы данных */}
              <Button
                onClick={() => createBackupMutation.mutate('Быстрый экспорт базы данных')}
                disabled={createBackupMutation.isPending}
                className="flex-1"
                variant="default"
              >
                {createBackupMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Экспорт всей базы данных
              </Button>
              
              {/* Импорт базы данных */}
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Импорт базы данных
                </Button>
              </div>
            </div>
            
            {/* Диалог импорта */}
            {uploadFile && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    Файл готов к импорту
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Выбранный файл: <strong>{uploadFile.name}</strong>
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="restore-immediately-quick"
                      checked={restoreImmediately}
                      onCheckedChange={setRestoreImmediately}
                    />
                    <Label htmlFor="restore-immediately-quick" className="text-sm">
                      Восстановить базу данных сразу
                    </Label>
                  </div>
                  
                  {restoreImmediately && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="clear-existing-quick"
                        checked={clearExisting}
                        onCheckedChange={setClearExisting}
                      />
                      <Label htmlFor="clear-existing-quick" className="text-sm">
                        Очистить существующие данные
                      </Label>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleFileUpload}
                      disabled={isUploading}
                      size="sm"
                      className="flex-1"
                    >
                      {isUploading ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Импортировать
                    </Button>
                    <Button
                      onClick={() => {
                        setUploadFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Статистика базы данных */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Статистика базы данных
            </CardTitle>
            <CardDescription>
              Текущее состояние и размер базы данных
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Загрузка статистики...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className="w-4 h-4" />
                      <span className="font-medium">Общие записи</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Archive className="w-4 h-4" />
                      <span className="font-medium">Таблицы</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.tables.length}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4" />
                      <span className="font-medium">Размер</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.estimatedSize}</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium">Детализация по таблицам:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {stats.tables.map((table, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">{table.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {table.count.toLocaleString()} записей
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Создание резервной копии */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Создать резервную копию
            </CardTitle>
            <CardDescription>
              Создание полной резервной копии базы данных
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Загрузка резервной копии */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Загрузить резервную копию
            </CardTitle>
            <CardDescription>
              Загрузка резервной копии из файла
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Список резервных копий */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Резервные копии
            </CardTitle>
            <CardDescription>
              Список доступных резервных копий
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backupsLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Загрузка списка резервных копий...
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Резервные копии не найдены</p>
                <p className="text-sm">Создайте первую резервную копию</p>
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((backup, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">{backup.filename}</span>
                          <Badge variant="outline" className="text-xs">
                            {backup.metadata?.version || 'v1.0.0'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(backup.created).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {formatFileSize(backup.size)}
                            </div>
                          </div>
                          {backup.metadata?.description && (
                            <p className="text-xs">{backup.metadata.description}</p>
                          )}
                          {backup.metadata?.tables && (
                            <div className="flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              <span className="text-xs">
                                Таблицы: {backup.metadata.tables.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadBackup(backup.filename)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <RefreshCw className="w-4 h-4" />
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
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => restoreBackupMutation.mutate({ 
                                    filename: backup.filename, 
                                    options: { clearExisting } 
                                  })}
                                  disabled={restoreBackupMutation.isPending}
                                  className="flex-1"
                                >
                                  {restoreBackupMutation.isPending ? (
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                  )}
                                  Восстановить
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteBackupMutation.mutate(backup.filename)}
                          disabled={deleteBackupMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}