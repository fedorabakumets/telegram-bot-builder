import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MediaManager } from "./media-manager";
import { UrlDownloader } from "./url-downloader";
import type { MediaFile } from "@shared/schema";
import { Upload, X, Eye, FileText, Image, Play, Volume2, LinkIcon, Download } from "lucide-react";

interface MediaSelectorProps {
  projectId: number;
  value?: string;
  onChange: (url: string, fileName?: string) => void;
  fileType?: 'photo' | 'video' | 'audio' | 'document';
  placeholder?: string;
  label?: string;
}

export function MediaSelector({ 
  projectId, 
  value, 
  onChange, 
  fileType, 
  placeholder = "Выберите файл или введите URL",
  label = "Медиафайл"
}: MediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

  const handleSelectFile = (file: MediaFile) => {
    setSelectedFile(file);
    onChange(file.url, file.fileName);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    onChange('');
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

  const isUsingUploadedFile = selectedFile && value === selectedFile.url;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium block">{label}</label>
      
      {isUsingUploadedFile ? (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            {getFileIcon(selectedFile.fileType)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.fileName}</p>
              <p className="text-xs text-gray-500 truncate">{selectedFile.url}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {selectedFile.fileType === 'photo' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(selectedFile.url, '_blank')}
                className="h-7 w-7 p-0"
              >
                <Eye className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearSelection}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="mb-2"
          />
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Выбрать или загрузить файл
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Управление медиафайлами</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="library" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="library" className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Библиотека файлов
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Загрузить файлы
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Загрузить по URL
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="library" className="mt-4">
                  <MediaManager 
                    projectId={projectId}
                    onSelectFile={handleSelectFile}
                    selectedType={fileType}
                  />
                </TabsContent>
                
                <TabsContent value="upload" className="mt-4">
                  <MediaManager 
                    projectId={projectId}
                    onSelectFile={handleSelectFile}
                    selectedType={fileType}
                    showUploader={true}
                  />
                </TabsContent>
                
                <TabsContent value="url" className="mt-4">
                  <UrlDownloader
                    projectId={projectId}
                    onDownloadComplete={(files) => {
                      if (files.length > 0) {
                        handleSelectFile(files[0]);
                      }
                      setIsOpen(false);
                    }}
                    onClose={() => setIsOpen(false)}
                  />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {selectedFile && (
        <div className="space-y-2">
          {selectedFile.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {selectedFile.description}
            </p>
          )}
          {selectedFile.tags && selectedFile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedFile.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}