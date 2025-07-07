import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMediaFiles, useUploadMedia, useDeleteMedia, useUpdateMedia, useIncrementUsage } from "@/hooks/use-media";
import { CameraCapture } from "./camera-capture";
import type { MediaFile } from "@shared/schema";
import { Loader2, Upload, Search, X, Edit, Trash2, Eye, Download, Play, Volume2, FileText, Image, AlertCircle, CheckCircle2, Camera, FolderOpen, Zap, Smartphone } from "lucide-react";

interface MediaManagerProps {
  projectId: number;
  onSelectFile?: (file: MediaFile) => void;
  selectedType?: 'photo' | 'video' | 'audio' | 'document';
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function MediaManager({ projectId, onSelectFile, selectedType }: MediaManagerProps) {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState(selectedType || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [showUploadDetails, setShowUploadDetails] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);

  const { data: allFiles, isLoading } = useMediaFiles(projectId);
  const { data: photoFiles } = useMediaFiles(projectId, 'photo');
  const { data: videoFiles } = useMediaFiles(projectId, 'video');
  const { data: audioFiles } = useMediaFiles(projectId, 'audio');
  const { data: documentFiles } = useMediaFiles(projectId, 'document');

  const uploadMutation = useUploadMedia(projectId);
  const deleteMutation = useDeleteMedia();
  const updateMutation = useUpdateMedia();
  const incrementUsage = useIncrementUsage();

  // Проверяем доступность камеры
  React.useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const hasVideoInput = devices.some(device => device.kind === 'videoinput');
          setHasCamera(hasVideoInput);
        })
        .catch(() => setHasCamera(false));
    }
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file size with different limits for different types
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return `Файл слишком большой. Максимальный размер: ${file.type.startsWith('video/') ? '100' : '50'}МБ`;
    }

    // Enhanced file type support
    const allowedTypes = [
      // Изображения
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
      // Видео
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/mkv',
      // Аудио
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/webm', 'audio/aac', 'audio/flac', 'audio/m4a',
      // Документы
      'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv', 'text/rtf',
      // Архивы
      'application/zip', 'application/rar', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'
    ];

    if (!allowedTypes.includes(file.type)) {
      return `Неподдерживаемый тип файла: ${file.type}`;
    }

    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(rejection => {
      const error = rejection.errors[0]?.message || 'Неподдерживаемый файл';
      toast({
        title: "Файл отклонен",
        description: `${rejection.file.name}: ${error}`,
        variant: "destructive",
      });
    });

    // Process accepted files
    acceptedFiles.forEach(file => {
      // Additional validation
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: "Файл отклонен",
          description: `${file.name}: ${validationError}`,
          variant: "destructive",
        });
        return;
      }

      // Add to uploading files list
      const uploadingFile: UploadingFile = {
        file,
        progress: 0,
        status: 'uploading'
      };

      setUploadingFiles(prev => [...prev, uploadingFile]);
      setShowUploadDetails(true);

      // Start upload with progress simulation
      uploadMutation.mutate({
        file,
        description: '',
        tags: []
      }, {
        onSuccess: () => {
          setUploadingFiles(prev => 
            prev.map(uf => 
              uf.file === file 
                ? { ...uf, progress: 100, status: 'success' }
                : uf
            )
          );
          toast({
            title: "Файл загружен",
            description: `${file.name} успешно загружен`,
          });
          // Remove from uploading list after delay
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(uf => uf.file !== file));
          }, 3000);
        },
        onError: (error) => {
          setUploadingFiles(prev => 
            prev.map(uf => 
              uf.file === file 
                ? { ...uf, status: 'error', error: error.message }
                : uf
            )
          );
          toast({
            title: "Ошибка загрузки",
            description: error.message,
            variant: "destructive",
          });
        }
      });

      // Simulate progress (since we don't have real progress from backend)
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(uf => {
            if (uf.file === file && uf.status === 'uploading' && uf.progress < 90) {
              return { ...uf, progress: Math.min(uf.progress + Math.random() * 20, 90) };
            }
            return uf;
          })
        );
      }, 500);

      setTimeout(() => clearInterval(progressInterval), 10000);
    });
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
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
    maxFiles: 10, // Maximum 10 files at once
    multiple: true,
    disabled: uploadingFiles.some(uf => uf.status === 'uploading'),
    // Better mobile support
    useFsAccessApi: false,
    getFilesFromEvent: async (event) => {
      const files = [];
      
      if (event.type === 'drop') {
        // Handle dropped files
        const items = Array.from(event.dataTransfer.items);
        for (const item of items) {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }
      } else if (event.target && event.target.files) {
        // Handle selected files
        files.push(...Array.from(event.target.files));
      }
      
      return files;
    }
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
      {/* Enhanced Upload Area */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Upload className="w-4 h-4 text-white" />
              </div>
              Загрузить медиафайлы
            </div>
            {uploadingFiles.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowUploadDetails(!showUploadDetails)}
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {uploadingFiles.length} загружается
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 group
              ${isDragActive && !isDragReject
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 scale-105' 
                : isDragReject
                ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                : uploadingFiles.some(uf => uf.status === 'uploading')
                ? 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
              }
            `}
          >
            <input {...getInputProps()} />
            
            {/* Upload Icon with Animation */}
            <div className="relative mb-4">
              {uploadingFiles.some(uf => uf.status === 'uploading') ? (
                <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
              ) : isDragActive && !isDragReject ? (
                <div className="w-16 h-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <Upload className="w-8 h-8 text-white" />
                </div>
              ) : isDragReject ? (
                <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              ) : (
                <div className="relative">
                  <Upload className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Upload Text */}
            {isDragActive && !isDragReject ? (
              <div>
                <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Отпустите файлы здесь!
                </p>
                <p className="text-sm text-blue-500">
                  Файлы будут загружены автоматически
                </p>
              </div>
            ) : isDragReject ? (
              <div>
                <p className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                  Неподдерживаемые файлы
                </p>
                <p className="text-sm text-red-500">
                  Проверьте тип и размер файлов
                </p>
              </div>
            ) : uploadingFiles.some(uf => uf.status === 'uploading') ? (
              <div>
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Загрузка файлов...
                </p>
                <p className="text-sm text-gray-500">
                  Пожалуйста, подождите
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Перетащите файлы сюда или нажмите для выбора
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Поддерживаются: изображения, видео, аудио, документы (до 50МБ)
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    Фото
                  </div>
                  <div className="flex items-center gap-1">
                    <Play className="w-4 h-4" />
                    Видео
                  </div>
                  <div className="flex items-center gap-1">
                    <Volume2 className="w-4 h-4" />
                    Аудио
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Документы
                  </div>
                </div>
              </div>
            )}

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
            </div>
          </div>

          {/* Upload Progress */}
          {showUploadDetails && uploadingFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  Прогресс загрузки ({uploadingFiles.length} файлов)
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowUploadDetails(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {uploadingFiles.map((uploadingFile, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {uploadingFile.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                      {uploadingFile.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {uploadingFile.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      <span className="text-sm font-medium truncate max-w-48">
                        {uploadingFile.file.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(uploadingFile.file.size)}
                    </div>
                  </div>
                  {uploadingFile.status === 'uploading' && (
                    <Progress value={uploadingFile.progress} className="h-2" />
                  )}
                  {uploadingFile.status === 'error' && uploadingFile.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {uploadingFile.error}
                    </p>
                  )}
                  {uploadingFile.status === 'success' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Файл успешно загружен
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-6 space-y-4">
            {/* Quick Upload Actions */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {hasCamera && (
                <Button
                  onClick={() => setShowCameraCapture(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800 hover:from-green-100 hover:to-blue-100 dark:hover:from-green-900/30 dark:hover:to-blue-900/30"
                >
                  <Camera className="w-4 h-4 text-green-600 dark:text-green-400" />
                  Сделать фото
                </Button>
              )}
              
              {/* Hidden file inputs for specific types */}
              <div className="flex gap-2">
                <input
                  type="file"
                  id="photo-input"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      onDrop(Array.from(e.target.files), []);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  onClick={() => document.getElementById('photo-input')?.click()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Image className="w-4 h-4" />
                  Фото
                </Button>
                
                <input
                  type="file"
                  id="video-input"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      onDrop(Array.from(e.target.files), []);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  onClick={() => document.getElementById('video-input')?.click()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Видео
                </Button>
                
                <input
                  type="file"
                  id="document-input"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      onDrop(Array.from(e.target.files), []);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  onClick={() => document.getElementById('document-input')?.click()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Документы
                </Button>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Макс. размер: 100МБ (видео), 50МБ (остальное)</span>
                <span>•</span>
                <span>До 10 файлов за раз</span>
              </div>
              {allFiles && allFiles.length > 0 && (
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  {allFiles.length} файлов в библиотеке
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Поиск файлов по имени или описанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Upload Stats */}
            {allFiles && allFiles.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Image className="w-4 h-4" />
                  <span>{photoFiles?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Play className="w-4 h-4" />
                  <span>{videoFiles?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Volume2 className="w-4 h-4" />
                  <span>{audioFiles?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{documentFiles?.length || 0}</span>
                </div>
              </div>
            )}
          </div>
          
          {searchQuery && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Найдено: {getFilesToDisplay().length} файлов
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="h-6 px-2"
              >
                <X className="w-3 h-3" />
                Очистить
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Camera Capture */}
      <CameraCapture
        projectId={projectId}
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onCapture={(file) => {
          // Process captured file same as dropped file
          const validationError = validateFile(file);
          if (validationError) {
            toast({
              title: "Файл отклонен",
              description: `${file.name}: ${validationError}`,
              variant: "destructive",
            });
            return;
          }

          const uploadingFile: UploadingFile = {
            file,
            progress: 0,
            status: 'uploading'
          };

          setUploadingFiles(prev => [...prev, uploadingFile]);
          setShowUploadDetails(true);
          setShowCameraCapture(false);

          uploadMutation.mutate({
            file,
            description: 'Фото с камеры',
            tags: ['камера', 'фото']
          }, {
            onSuccess: () => {
              setUploadingFiles(prev => 
                prev.map(uf => 
                  uf.file === file 
                    ? { ...uf, progress: 100, status: 'success' }
                    : uf
                )
              );
              toast({
                title: "Фото загружено",
                description: `${file.name} успешно загружен`,
              });
              setTimeout(() => {
                setUploadingFiles(prev => prev.filter(uf => uf.file !== file));
              }, 3000);
            },
            onError: (error) => {
              setUploadingFiles(prev => 
                prev.map(uf => 
                  uf.file === file 
                    ? { ...uf, status: 'error', error: error.message }
                    : uf
                )
              );
              toast({
                title: "Ошибка загрузки",
                description: error.message,
                variant: "destructive",
              });
            }
          });
        }}
      />
    </div>
  );
}