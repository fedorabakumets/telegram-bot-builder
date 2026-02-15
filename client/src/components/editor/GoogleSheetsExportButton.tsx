/**
 * @fileoverview Компонент кнопки экспорта данных пользователей в Google Таблицы
 * Реализует интерфейс для экспорта пользовательских данных из базы данных проекта в Google Таблицы.
 * Включает в себя диалог подтверждения, индикатор прогресса и обработку ошибок.
 * @author Telegram Bot Builder Team
 * @version 1.0.0
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { prepareDataForExport } from './prepareDataForExport';

/**
 * @interface GoogleSheetsExportButtonProps
 * @description Свойства компонента кнопки экспорта в Google Таблицы
 * @property {number} projectId - Идентификатор проекта, из которого будут экспортироваться данные
 * @property {string} projectName - Название проекта, используется для идентификации в процессе экспорта
 */
interface GoogleSheetsExportButtonProps {
  projectId: number;
  projectName: string;
}

/**
 * @function GoogleSheetsExportButton
 * @description Компонент кнопки экспорта данных пользователей в Google Таблицы
 * Предоставляет интерфейс для инициации процесса экспорта пользовательских данных в Google Таблицы.
 * Включает в себя диалог подтверждения, индикатор прогресса и обработку ошибок.
 * @param {GoogleSheetsExportButtonProps} props - Свойства компонента
 * @param {number} props.projectId - Идентификатор проекта, из которого будут экспортироваться данные
 * @param {string} props.projectName - Название проекта, используется для идентификации в процессе экспорта
 * @returns {JSX.Element} Кнопка экспорта в Google Таблицы с диалогом подтверждения и индикатором прогресса
 *
 * @example
 * <GoogleSheetsExportButton projectId={123} projectName="Мой проект" />
 *
 * @remarks
 * Компонент использует OAuth 2.0 для аутентификации с Google API.
 * Для работы компонента должен быть настроен файл credentials.json.
 *
 * @see {@link https://developers.google.com/sheets/api|Google Sheets API Documentation}
 */
export function GoogleSheetsExportButton({ projectId, projectName }: GoogleSheetsExportButtonProps) {
  // Проверяем, что обязательные параметры переданы
  if (!projectId || !projectName) {
    console.error('GoogleSheetsExportButton: Missing required props - projectId and projectName are required');
    return null;
  }
  /**
   * @type {boolean}
   * @description Флаг, указывающий на то, выполняется ли в данный момент экспорт
   * Используется для управления состоянием кнопки и отображением индикатора прогресса
   */
  const [isExporting, setIsExporting] = useState(false);

  /**
   * @type {number}
   * @description Значение прогресса экспорта (в процентах)
   * Используется для отображения прогресса выполнения операции экспорта
   */
  const [progress, setProgress] = useState(0);

  /**
   * @type {ReturnType<typeof useToast>}
   * @description Объект, содержащий методы для управления уведомлениями
   * Используется для отображения сообщений об успешном экспорте или ошибках
   * @property {Function} toast - Функция для создания уведомлений
   * @property {ToasterToast[]} toasts - Массив активных уведомлений
   * @property {Function} dismiss - Функция для скрытия уведомлений
   */
  const { toast } = useToast();

  /**
   * @function handleExport
   * @async
   * @description Обработчик события нажатия на кнопку экспорта
   * Выполняет последовательность действий для экспорта данных пользователей в Google Таблицы:
   * 1. Устанавливает состояние экспорта
   * 2. Получает данные пользователей через API
   * 3. Подготавливает данные для экспорта
   * 4. Отправляет данные в Google Таблицы через серверный маршрут
   * 5. Обрабатывает результат операции и отображает уведомление
   * @returns {Promise<void>} Промис, который разрешается после завершения экспорта
   *
   * @throws {Error} Если возникает ошибка при получении данных или в процессе экспорта
   */
  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0); // Сбросить прогресс перед началом

    let errorMessage = ''; // Объявляем переменную вне блока catch
    
    try {
      // 1. Получить данные пользователей
      setProgress(10);
      const usersData = await apiRequest('GET', `/api/projects/${projectId}/users`);

      // 2. Подготовить данные для экспорта
      setProgress(30);
      const preparedData = prepareDataForExport(usersData);

      // 3. Отправить данные в Google Таблицы через серверный маршрут
      setProgress(60);
      await apiRequest('POST', `/api/projects/${projectId}/export-to-google-sheets`, {
        data: preparedData,
        projectName: projectName,
      });

      setProgress(100);
      toast({
        title: 'Экспорт в Google Таблицы',
        description: 'Данные успешно экспортированы в Google Таблицы.',
      });
    } catch (error) {
      // Проверяем, является ли ошибка связанной с аутентификацией
      errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      if (errorMessage.includes('OAuth token not found') || errorMessage.includes('invalid or expired')) {
        // Если ошибка связана с аутентификацией, предлагаем пользователю пройти аутентификацию
        const shouldAuthenticate = window.confirm(
          'Для экспорта в Google Таблицы требуется аутентификация. Перейти к процессу аутентификации?'
        );
        
        if (shouldAuthenticate) {
          try {
            // Запрашиваем URL аутентификации
            const authResponse = await apiRequest('GET', '/api/google-auth/start');
            const authUrl = authResponse.authUrl;
            
            // Открываем окно аутентификации
            const popup = window.open(authUrl, 'google-auth', 'width=600,height=700');
            
            // Проверяем, закрыто ли окно аутентификации
            const checkPopupClosed = setInterval(() => {
              if (popup?.closed) {
                clearInterval(checkPopupClosed);
                
                // После аутентификации пробуем снова экспортировать
                setTimeout(async () => {
                  try {
                    // Повторно получаем данные, так как preparedData недоступна в этой области видимости
                    const usersData = await apiRequest('GET', `/api/projects/${projectId}/users`);
                    const retryPreparedData = prepareDataForExport(usersData);
                    
                    await apiRequest('POST', `/api/projects/${projectId}/export-to-google-sheets`, {
                      data: retryPreparedData,
                      projectName: projectName,
                    });
                    
                    toast({
                      title: 'Экспорт в Google Таблицы',
                      description: 'Данные успешно экспортированы в Google Таблицы.',
                    });
                  } catch (retryError) {
                    console.error('Ошибка повторного экспорта в Google Таблицы:', retryError);
                    toast({
                      title: 'Ошибка экспорта',
                      description: retryError instanceof Error ? retryError.message : 'Произошла ошибка при экспорте данных в Google Таблицы. Проверьте консоль для подробностей.',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsExporting(false);
                    // Сбросить прогресс после завершения
                    setTimeout(() => setProgress(0), 1000);
                  }
                }, 2000); // Ждем 2 секунды перед повторной попыткой
              }
            }, 1000);
          } catch (authError) {
            console.error('Ошибка аутентификации Google:', authError);
            toast({
              title: 'Ошибка аутентификации',
              description: 'Не удалось инициировать процесс аутентификации Google. Проверьте консоль для подробностей.',
              variant: 'destructive',
            });
          }
        } else {
          // Если пользователь отказался от аутентификации, просто покажем сообщение
          toast({
            title: 'Экспорт отменен',
            description: 'Для экспорта в Google Таблицы необходимо пройти аутентификацию.',
            variant: 'destructive',
          });
        }
      } else {
        // Для других ошибок просто выводим сообщение
        console.error('Ошибка экспорта в Google Таблицы:', error);
        toast({
          title: 'Ошибка экспорта',
          description: error instanceof Error ? error.message : 'Произошла ошибка при экспорта данных в Google Таблицы. Проверьте консоль для подробностей.',
          variant: 'destructive',
        });
      }
    } finally {
      if (!(errorMessage && (errorMessage.includes('OAuth token not found') || errorMessage.includes('invalid or expired')))) {
        // Не сбрасываем состояние, если это ошибка аутентификации, т.к. далее идет повторная попытка
        setIsExporting(false);
        // Сбросить прогресс после завершения
        setTimeout(() => setProgress(0), 1000);
      }
    }
  };

  return (
    <div className="w-full space-y-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border-2 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50 w-full"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Экспорт...
              </>
            ) : (
              <>
                📊 Экспорт в Google Таблицы
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердить экспорт в Google Таблицы?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите экспортировать данные пользователей в Google Таблицы? Это действие может занять некоторое время.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport}>Экспортировать</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isExporting && (
        <div className="w-full">
          <Progress value={progress} className="w-full" />
          <div className="text-xs text-muted-foreground text-right mt-1">{progress}%</div>
        </div>
      )}
    </div>
  );
}