import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMediaFiles, useUploadMedia, useDeleteMedia, useUpdateMedia, useIncrementUsage } from "@/hooks/use-media";
import type { MediaFile } from "@shared/schema";
import { Loader2, Upload, Search, X, Edit, Trash2, Eye, Download, Play, Volume2, FileText, Image } from "lucide-react";

interface MediaManagerProps {
  projectId: number;
  onSelectFile?: (file: MediaFile) => void;
  selectedType?: 'photo' | 'video' | 'audio' | 'document';
}

export function MediaManager({ projectId, onSelectFile, selectedType }: MediaManagerProps) {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState(selectedType || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);

  const { data: allFiles, isLoading } = useMediaFiles(projectId);
  const { data: photoFiles } = useMediaFiles(projectId, 'photo');
  const { data: videoFiles } = useMediaFiles(projectId, 'video');
  const { data: audioFiles } = useMediaFiles(projectId, 'audio');
  const { data: documentFiles } = useMediaFiles(projectId, 'document');

  const uploadMutation = useUploadMedia(projectId);
  const deleteMutation = useDeleteMedia();
  const updateMutation = useUpdateMedia();
  const incrementUsage = useIncrementUsage();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      uploadMutation.mutate({
        file,
        description: '',
        tags: []
      }, {
        onSuccess: () => {
          toast({
            title: "Файл загружен",
            description: `${file.name} успешно загружен`,
          });
        },
        onError: (error) => {
          toast({
            title: "Ошибка загрузки",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    });
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg', '.avi', '.mov'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.mpeg', '.webm'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/rar': ['.rar']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleDeleteFile = (file: MediaFile) => {
    deleteMutation.mutate(file.id, {
      onSuccess: () => {
        toast({
          title: "Файл удален",
          description: `${file.fileName} был удален`,
        });
        setSelectedFile(null);
      },
      onError: (error) => {
        toast({
          title: "Ошибка удаления",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleSelectFile = (file: MediaFile) => {
    if (onSelectFile) {
      onSelectFile(file);
      incrementUsage.mutate(file.id);
    } else {
      setSelectedFile(file);
    }
  };

  const handleUpdateFile = (file: MediaFile, updates: Partial<MediaFile>) => {
    updateMutation.mutate({
      id: file.id,
      updates
    }, {
      onSuccess: () => {
        toast({
          title: "Файл обновлен",
          description: "Информация о файле была обновлена",
        });
        setEditingFile(null);
      },
      onError: (error) => {
        toast({
          title: "Ошибка обновления",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'photo': return <Image className="w-4 h-4" />;
      case 'video': return <Play className="w-4 h-4" />;
      case 'audio': return <Volume2 className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFilesToDisplay = () => {
    let files: MediaFile[] = [];
    
    switch (currentTab) {
      case 'photo': files = photoFiles || []; break;
      case 'video': files = videoFiles || []; break;
      case 'audio': files = audioFiles || []; break;
      case 'document': files = documentFiles || []; break;
      default: files = allFiles || [];
    }

    if (searchQuery) {
      files = files.filter(file => 
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return files;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Загрузить медиафайлы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-blue-600 dark:text-blue-400">Отпустите файлы здесь...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Перетащите файлы сюда или нажмите для выбора</p>
                <p className="text-sm text-gray-500">
                  Поддерживаются: изображения, видео, аудио, документы (до 50МБ)
                </p>
              </div>
            )}
          </div>
          {uploadMutation.isPending && (
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Загрузка файлов...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Поиск файлов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="photo">Фото</TabsTrigger>
          <TabsTrigger value="video">Видео</TabsTrigger>
          <TabsTrigger value="audio">Аудио</TabsTrigger>
          <TabsTrigger value="document">Документы</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilesToDisplay().map((file) => (
              <Card key={file.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.fileType)}
                      <span className="font-medium text-sm truncate">{file.fileName}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSelectFile(file)}
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingFile(file)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteFile(file)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mb-3">
                    {file.fileType === 'photo' && (
                      <img
                        src={file.url}
                        alt={file.fileName}
                        className="w-full h-32 object-cover rounded border"
                      />
                    )}
                    {file.fileType === 'video' && (
                      <video
                        src={file.url}
                        className="w-full h-32 object-cover rounded border"
                        controls={false}
                      />
                    )}
                    {file.fileType === 'audio' && (
                      <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded border flex items-center justify-center">
                        <Volume2 className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {file.fileType === 'document' && (
                      <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded border flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>Использован: {file.usageCount || 0} раз</span>
                    </div>
                    {file.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {file.description}
                      </p>
                    )}
                    {file.tags && file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {file.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {file.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{file.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {getFilesToDisplay().length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                {searchQuery ? 'Файлы не найдены' : 'Нет загруженных файлов'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingFile && (
        <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать файл</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  value={editingFile.description || ''}
                  onChange={(e) => setEditingFile({
                    ...editingFile,
                    description: e.target.value
                  })}
                  placeholder="Описание файла"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Теги (через запятую)</label>
                <Input
                  value={editingFile.tags?.join(', ') || ''}
                  onChange={(e) => setEditingFile({
                    ...editingFile,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  placeholder="тег1, тег2, тег3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingFile(null)}>
                  Отмена
                </Button>
                <Button onClick={() => handleUpdateFile(editingFile, {
                  description: editingFile.description,
                  tags: editingFile.tags
                })}>
                  Сохранить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}