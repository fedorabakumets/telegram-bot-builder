import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUploadMedia } from "@/hooks/use-media";
import { Camera, X, RotateCcw, Zap, Loader2 } from "lucide-react";

interface CameraCaptureProps {
  projectId: number;
  onCapture?: (file: File) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export function CameraCapture({ projectId, onCapture, onClose, isOpen }: CameraCaptureProps) {
  const { toast } = useToast();
  const uploadMutation = useUploadMedia(projectId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    try {
      // Останавливаем предыдущий поток, если он есть
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      toast({
        title: "Ошибка камеры",
        description: "Не удалось получить доступ к камере. Проверьте разрешения.",
        variant: "destructive",
      });
    }
  }, [facing, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setCapturedImage(null);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
      }
    }
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const switchCamera = useCallback(() => {
    setFacing(prev => prev === 'user' ? 'environment' : 'user');
    setCapturedImage(null);
    if (isStreaming) {
      startCamera();
    }
  }, [isStreaming, startCamera]);

  const savePhoto = useCallback(async () => {
    if (capturedImage && canvasRef.current) {
      try {
        // Конвертируем canvas в Blob
        canvasRef.current.toBlob(async (blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `camera-photo-${timestamp}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            if (onCapture) {
              onCapture(file);
            } else {
              // Загружаем файл напрямую
              uploadMutation.mutate({
                file,
                description: 'Фото с камеры',
                tags: ['камера', 'фото']
              }, {
                onSuccess: () => {
                  toast({
                    title: "Фото сохранено",
                    description: "Фото успешно загружено в библиотеку",
                  });
                  handleClose();
                },
                onError: (error) => {
                  toast({
                    title: "Ошибка загрузки",
                    description: error.message,
                    variant: "destructive",
                  });
                }
              });
            }
          }
        }, 'image/jpeg', 0.8);
      } catch (error) {
        console.error('Ошибка сохранения фото:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить фото",
          variant: "destructive",
        });
      }
    }
  }, [capturedImage, onCapture, uploadMutation, toast]);

  const handleClose = useCallback(() => {
    stopCamera();
    if (onClose) {
      onClose();
    }
  }, [stopCamera, onClose]);

  // Эффект для запуска камеры при открытии диалога
  React.useEffect(() => {
    if (isOpen && !isStreaming && !capturedImage) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
    }
  }, [isOpen, isStreaming, capturedImage, startCamera, stopCamera]);

  // Очистка при размонтировании
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Съемка с камеры
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Camera Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {isStreaming && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                    <Button
                      onClick={switchCamera}
                      variant="secondary"
                      size="sm"
                      className="rounded-full w-10 h-10 p-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={capturePhoto}
                      className="rounded-full w-16 h-16 bg-white border-4 border-white hover:bg-gray-100"
                    >
                      <div className="w-full h-full rounded-full bg-white" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}
            
            {!isStreaming && !capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button onClick={startCamera} className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Включить камеру
                </Button>
              </div>
            )}
          </div>

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Controls */}
          {capturedImage && (
            <div className="flex justify-between gap-2">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1"
              >
                Переснять
              </Button>
              <Button
                onClick={savePhoto}
                disabled={uploadMutation.isPending}
                className="flex-1 flex items-center gap-2"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Сохранить
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 text-center">
            {!isStreaming && !capturedImage && "Нажмите 'Включить камеру' для начала съемки"}
            {isStreaming && !capturedImage && "Нажмите на белую кнопку для съемки"}
            {capturedImage && "Фото готово! Сохраните или переснимите"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}