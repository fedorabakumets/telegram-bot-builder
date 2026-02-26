/**
 * @fileoverview Компонент строки ответа в таблице ответов
 * @description Отображает данные ответа пользователя в таблице вкладки "Ответы"
 */

import { TableRow, TableCell } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { ResponsePhoto } from './response-photo';

/**
 * Пропсы компонента ResponseRow
 */
interface ResponseRowProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Ключ ответа (переменная) */
  keyName: string;
  /** Индекс ответа для уникального key */
  responseIndex: number;
  /** Значение ответа */
  value: unknown;
}

/**
 * Компонент строки ответа в таблице
 * @param props - Пропсы компонента
 * @returns JSX компонент строки таблицы
 */
export function ResponseRow({
  user,
  keyName,
  responseIndex,
  value,
}: ResponseRowProps): React.JSX.Element {
  // Парсинг ответа
  let responseData: any = value;
  if (typeof value === 'string') {
    try {
      responseData = JSON.parse(value);
    } catch {
      responseData = { value: value, type: 'text' };
    }
  } else if (typeof value === 'object' && value !== null) {
    responseData = value;
  } else {
    responseData = { value: String(value), type: 'text' };
  }

  const answerValue = responseData?.value !== undefined
    ? responseData.value
    : (typeof value === 'object' && value !== null ? JSON.stringify(value) : (value ?? '-'));

  // Формирование имени пользователя
  const formatUserName = (u: UserBotData): string => {
    const parts = [u.firstName, u.lastName].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    if (u.userName) return `@${u.userName}`;
    return `ID: ${u.userId}`;
  };

  return (
    <TableRow
      key={`${user.id}-${keyName}-${responseIndex}`}
      className="border-b border-border/30 hover:bg-muted/30 transition-colors h-14"
    >
      <TableCell className="py-2">
        <div className="font-medium text-sm truncate">{formatUserName(user)}</div>
        <div className="text-xs text-muted-foreground truncate">ID: {user.id}</div>
      </TableCell>
      <TableCell className="py-2">
        <div className="font-medium text-sm">
          {keyName.startsWith('response_') ? keyName.replace('response_', 'Ответ ') : keyName}
        </div>
      </TableCell>
      <TableCell className="py-2 max-w-sm">
        {(() => {
          const valueStr = String(answerValue);
          const isImageUrl = valueStr.startsWith('http://') || valueStr.startsWith('https://') || valueStr.startsWith('/uploads/');
          
          // Если это URL изображения (не photo тип)
          if (isImageUrl && !responseData?.media && !responseData?.photoUrl && responseData?.type !== 'photo' && responseData?.type !== 'image') {
            return (
              <div className="rounded-lg overflow-hidden max-w-[150px] relative">
                <img
                  src={valueStr}
                  alt="Ответ"
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'text-xs text-muted-foreground italic';
                    fallback.textContent = 'Файл не найден';
                    img.parentNode?.appendChild(fallback);
                  }}
                />
              </div>
            );
          }
          
          // Если это photo/image тип — используем ResponsePhoto
          if (responseData?.media || responseData?.photoUrl || responseData?.type === 'photo' || responseData?.type === 'image') {
            return <ResponsePhoto responseData={responseData} answerValue={valueStr} getPhotoUrlFromMessages={() => null} />;
          }
          
          // Обычный текст
          return (
            <p className="text-sm text-green-800 dark:text-green-200 font-medium break-all">{valueStr === 'undefined' || valueStr === 'null' ? '-' : valueStr}</p>
          );
        })()}
      </TableCell>
    </TableRow>
  );
}
