/**
 * @fileoverview Компонент кнопки экспорта данных пользователей в Google Таблицы
 * Реализует интерфейс для экспорта пользовательских данных из базы данных проекта в Google Таблицы.
 * Включает в себя диалог подтверждения, индикатор прогресса и обработку ошибок.
 * @author Telegram Bot Builder Team
 * @version 1.0.0
 */

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
  const queryClient = useQueryClient();

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
    setProgress(0);

    // Переменные для обработки ошибок (объявляем вне try/catch для использования в finally)
    let requiresAuth = false;
    let errorMessage = '';

    try {
      // 1. Получить данные пользователей
      setProgress(10);
      const usersData = await apiRequest('GET', `/api/projects/${projectId}/users`);

      // 2. Подготовить данные для экспорта
      setProgress(30);
      const preparedData = prepareDataForExport(usersData);

      // 3. Отправить данные в Google Таблицы через серверный маршрут
      setProgress(60);
      const exportResult = await apiRequest('POST', `/api/projects/${projectId}/export-to-google-sheets`, {
        data: preparedData,
        projectName: projectName,
      });

      setProgress(100);

      // Создаем уведомление с возможностью копирования всей информации
      const fullMessage = `Данные успешно экспортированы в Google Таблицы.\nСсылка на таблицу: ${exportResult.spreadsheetUrl}`;

      toast({
        title: 'Экспорт в Google Таблицы',
        description: (
          <div className="space-y-2">
            <p>Данные успешно экспортированы в Google Таблицы.</p>
            <a
              href={exportResult.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline break-all"
            >
              {exportResult.spreadsheetUrl}
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(fullMessage)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Копировать текст
            </button>
          </div>
        ),
      });
    } catch (error) {
      console.log('Полная ошибка при экспорте:', error);

      // Извлекаем данные об ошибке
      if (error instanceof Error) {
        errorMessage = error.message;
        requiresAuth = (error as any).requiresAuth === true;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).message || 'Неизвестная ошибка';
        requiresAuth = (error as any).requiresAuth === true;
      } else {
        errorMessage = String(error);
      }

      console.log('Ошибка:', errorMessage);
      console.log('Требуется аутентификация:', requiresAuth);

      // Если ошибка аутентификации - запускаем процесс OAuth
      if (errorMessage.includes('OAuth token not found') ||
        errorMessage.includes('invalid or expired') ||
        errorMessage.includes('Authentication required') ||
        errorMessage.includes('Credentials file not found') ||
        requiresAuth) {

        try {
          // Запрашиваем URL аутентификации
          const authResponse = await apiRequest('GET', '/api/google-auth/start');
          const authUrl = authResponse.authUrl;

          // Показываем уведомление о необходимости аутентификации
          toast({
            title: 'Требуется аутентификация',
            description: 'Для экспорта в Google Таблицы требуется пройти аутентификацию. Пожалуйста, завершите процесс в открывшейся вкладке.',
          });

          // Открываем URL аутентификации в новой вкладке
          const authWindow = window.open(authUrl, '_blank');

          // Функция для обработки сообщений от вкладки аутентификации
          const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'auth-success') {
              // Успешная аутентификация, закрываем вкладку и повторяем экспорт
              if (authWindow) {
                authWindow.close();
              }

              // Убираем обработчик
              window.removeEventListener('message', handleMessage);

              // Повторяем экспорт
              setTimeout(() => {
                handleExport();
              }, 1000);
            } else if (event.data.type === 'auth-error') {
              // Ошибка аутентификации
              if (authWindow) {
                authWindow.close();
              }

              // Убираем обработчик
              window.removeEventListener('message', handleMessage);

              toast({
                title: 'Ошибка аутентификации',
                description: event.data.message || 'Произошла ошибка при аутентификации',
                variant: 'destructive',
              });
            }
          };

          // Добавляем обработчик сообщений
          window.addEventListener('message', handleMessage);
        } catch (authError) {
          console.error('Ошибка аутентификации Google:', authError);
          toast({
            title: 'Ошибка аутентификации',
            description: 'Не удалось инициировать процесс аутентификации Google. Проверьте консоль для подробностей.',
            variant: 'destructive',
          });
        }
      } else {
        // Для других ошибок просто выводим сообщение
        console.error('Ошибка экспорта в Google Таблицы:', error);
        toast({
          title: 'Ошибка экспорта',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      // Сбрасываем состояние только если это не ошибка аутентификации
      if (!requiresAuth) {
        setIsExporting(false);
        // Сбросить прогресс после завершения
        setTimeout(() => setProgress(0), 1000);
        // Обновляем данные проекта для отображения актуального времени экспорта
        queryClient.invalidateQueries({
          queryKey: [`/api/projects/${projectId}`],
        });
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