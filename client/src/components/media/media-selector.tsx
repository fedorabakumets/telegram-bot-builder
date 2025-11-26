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
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      {label && (
        <div className="flex items-center gap-2">
          <i className="fas fa-image text-slate-600 dark:text-slate-400 text-sm sm:text-base"></i>
          <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
        </div>
      )}
      
      {isUsingUploadedFile ? (
        <div className="space-y-3">
          {/* Selected File Card */}
          <div className="relative overflow-hidden rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/30 dark:to-green-900/20 p-3 sm:p-4 hover:border-emerald-300/80 dark:hover:border-emerald-700/80 transition-all">
            <div className="flex items-start gap-3">
              {/* File Icon */}
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">
                  {selectedFile.fileType === 'photo' ? '🖼️' : 
                   selectedFile.fileType === 'video' ? '🎥' : 
                   selectedFile.fileType === 'audio' ? '🎵' : '📄'}
                </span>
              </div>
              
              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-100 truncate">{selectedFile.fileName}</p>
                <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70 truncate mt-0.5">{selectedFile.fileType.toUpperCase()}</p>
                <p className="text-xs text-emerald-600/50 dark:text-emerald-400/50 truncate mt-1">{selectedFile.url}</p>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {selectedFile.fileType === 'photo' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(selectedFile.url, '_blank')}
                    className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/50 transition-colors"
                    title="Просмотр"
                  >
                    <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearSelection}
                  className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-red-200/50 dark:hover:bg-red-800/50 transition-colors"
                  title="Удалить"
                >
                  <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                </Button>
              </div>
            </div>
          </div>

          {/* File Details */}
          {(selectedFile.description || selectedFile.tags?.length) && (
            <div className="space-y-2 sm:space-y-2.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg p-2.5 sm:p-3 border border-slate-200/40 dark:border-slate-800/40">
              {selectedFile.description && (
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <i className="fas fa-quote-left mr-2 text-slate-400 dark:text-slate-600"></i>
                  {selectedFile.description}
                </p>
              )}
              {selectedFile.tags && selectedFile.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedFile.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs font-medium">
                      <i className="fas fa-tag text-xs mr-1"></i>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* URL Input */}
          <div className="relative">
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="h-10 sm:h-11 text-xs sm:text-sm pl-4 sm:pl-4 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-200/50 dark:focus:ring-blue-900/50 bg-white dark:bg-slate-950 transition-all"
            />
            <i className="fas fa-link absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-sm pointer-events-none"></i>
          </div>
          
          {/* Or Divider */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 h-px bg-slate-300/30 dark:bg-slate-700/30"></div>
            <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">или</span>
            <div className="flex-1 h-px bg-slate-300/30 dark:bg-slate-700/30"></div>
          </div>

          {/* Media Browser Button */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full h-10 sm:h-11 text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 hover:from-blue-600 hover:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700 shadow-md hover:shadow-lg transition-all"
              >
                <Upload className="w-4 h-4 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden sm:inline">Выбрать или загрузить файл</span>
                <span className="sm:hidden">Выбрать файл</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  <i className="fas fa-folder-open mr-2 text-blue-600 dark:text-blue-400"></i>
                  Управление медиафайлами
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="library" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="library" className="flex items-center gap-2 text-xs sm:text-sm py-2">
                    <Image className="w-4 h-4" />
                    <span className="hidden sm:inline">Библиотека</span>
                    <span className="sm:hidden">Библ</span>
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2 text-xs sm:text-sm py-2">
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Загрузить</span>
                    <span className="sm:hidden">Файлы</span>
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2 text-xs sm:text-sm py-2">
                    <LinkIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">По URL</span>
                    <span className="sm:hidden">URL</span>
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
    </div>
  );
}