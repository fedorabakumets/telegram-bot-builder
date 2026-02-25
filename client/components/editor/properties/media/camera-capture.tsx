import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUploadMedia } from "@/components/editor/properties/media/use-media";
import { Camera, RotateCcw, Zap, Loader2 } from "lucide-react";

/**
 * @interface CameraCaptureProps
 * @description Интерфейс свойств компонента CameraCapture
 * @property {number} projectId - ID проекта, к которому будет привязано фото
 * @property {(file: File) => void} [onCapture] - Функция обратного вызова, вызываемая при захвате изображения
 * @property {() => void} [onClose] - Функция обратного вызова, вызываемая при закрытии компонента
 * @property {boolean} isOpen - Флаг открытия/закрытия модального окна камеры
 */
interface CameraCaptureProps {
  projectId: number;
  onCapture?: (file: File) => void;
  onClose?: () => void;
  isOpen: boolean;
}

/**
 * @function CameraCapture
 * @description Компонент захвата изображения с камеры устройства
 * Позволяет пользователю включать камеру, делать фотографии и сохранять их
 * @param {CameraCaptureProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент захвата изображения с камеры
 */
export function CameraCapture({ projectId, onCapture, onClose, isOpen }: CameraCaptureProps) {
  const { toast } = useToast();
  const uploadMutation = useUploadMedia(projectId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');

  /**
   * @function startCamera
   * @description Запускает камеру устройства и начинает трансляцию видео
   * Останавливает предыдущий поток, если он существует, и запрашивает новый доступ к камере
   * Обрабатывает ошибки доступа к камере и показывает уведомления
   * @returns {Promise<void>}
   */
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

  /**
   * @function stopCamera
   * @description Останавливает трансляцию с камеры и освобождает ресурсы
   * Останавливает все треки потока и сбрасывает состояние компонента
   * @returns {void}
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setCapturedImage(null);
  }, []);

  /**
   * @function capturePhoto
   * @description Захватывает текущий кадр с видео и сохраняет его как изображение
   * Использует canvas для создания снимка с видеоэлемента
   * @returns {void}
   */
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

  /**
   * @function retakePhoto
   * @description Сбрасывает захваченное изображение и возвращается к режиму просмотра камеры
   * Позволяет пользователю сделать новый снимок
   * @returns {void}
   */
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  /**
   * @function switchCamera
   * @description Переключает между передней и задней камерой устройства
   * Если камера активна, перезапускает её с новым направлением
   * @returns {void}
   */
  const switchCamera = useCallback(() => {
    setFacing(prev => prev === 'user' ? 'environment' : 'user');
    setCapturedImage(null);
    if (isStreaming) {
      startCamera();
    }
  }, [isStreaming, startCamera]);

  /**
   * @function savePhoto
   * @description Сохраняет захваченное изображение в виде файла и загружает его
   * Конвертирует изображение из canvas в формат Blob, создает файл с временной меткой
   * и вызывает соответствующую функцию для обработки файла (либо через onCapture, либо напрямую загружает)
   * @returns {Promise<void>}
   */
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

  /**
   * @function handleClose
   * @description Обработчик закрытия компонента
   * Останавливает камеру и вызывает внешнюю функцию onClose, если она предоставлена
   * @returns {void}
   */
  const handleClose = useCallback(() => {
    stopCamera();
    if (onClose) {
      onClose();
    }
  }, [stopCamera, onClose]);

  /**
   * @description Эффект для запуска камеры при открытии диалога
   * Запускает камеру, если диалог открыт и нет активной трансляции или захваченного изображения
   * Останавливает камеру, если диалог закрыт
   */
  React.useEffect(() => {
    if (isOpen && !isStreaming && !capturedImage) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
    }
  }, [isOpen, isStreaming, capturedImage, startCamera, stopCamera]);

  /**
   * @description Эффект очистки при размонтировании компонента
   * Останавливает камеру при размонтировании компонента для освобождения ресурсов
   */
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
          <DialogDescription className="sr-only">
            Сделайте фотографию с камеры устройства
          </DialogDescription>
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