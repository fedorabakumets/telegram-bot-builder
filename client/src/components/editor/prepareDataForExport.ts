/**
 * @fileoverview Функция подготовки данных пользователей для экспорта в Google Таблицы
 */

/**
 * @function prepareDataForExport
 * @description Подготавливает данные пользователей для экспорта в Google Таблицы
 * @param {any[]} usersData - Массив данных пользователей
 * @returns {Array<Object>} Подготовленный массив данных для экспорта
 */
export function prepareDataForExport(usersData: any[]): Array<any> {
  return usersData.map((user) => {
    // Форматирование дат
    const formatDate = (date: Date | string | null) => {
      if (!date) return '';
      try {
        const dateObj = typeof date === 'string' ? new Date(date) :
                       date instanceof Date ? date :
                       null;

        if (!dateObj) return '';

        return dateObj.toLocaleString('ru-RU', {
          timeZone: 'Europe/Moscow',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return '';
      }
    };

    // Форматирование значений
    const formatValue = (value: any) => {
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      if (value instanceof Date) {
        return formatDate(value);
      }
      if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
        // Для URL, возможно, стоит оставить как есть или обернуть в формулу =HYPERLINK()
        // Пока оставлю как есть
        return value;
      }
      return String(value);
    };

    // Извлечение медиа-файлов из userData
    let photoUrls: string[] = [];
    let mediaUrls: string[] = [];

    if (user.userData) {
      try {
        // Если userData - это строка, парсим её как JSON
        const parsedUserData = typeof user.userData === 'string' ? JSON.parse(user.userData) : user.userData;

        // Извлечение photoUrl
        if (parsedUserData.photoUrl) {
          photoUrls.push(parsedUserData.photoUrl);
        }

        // Извлечение media
        if (parsedUserData.media && Array.isArray(parsedUserData.media)) {
          parsedUserData.media.forEach((mediaItem: any) => {
            if (mediaItem.url) {
              mediaUrls.push(mediaItem.url);
            }
          });
        }

        // Также проверяем на наличие media в корне объекта (если он был преобразован из BotMessage)
        if (parsedUserData.media && Array.isArray(parsedUserData.media)) {
          parsedUserData.media.forEach((mediaItem: any) => {
            if (mediaItem.url) {
              mediaUrls.push(mediaItem.url);
            }
          });
        }
      } catch (e) {
        console.error('Ошибка при парсинге userData:', e);
        // Если произошла ошибка при парсинге, просто пропускаем извлечение медиа
      }
    }

    return {
      id: formatValue(user.id),
      userId: formatValue(user.userId),
      firstName: formatValue(user.firstName),
      lastName: formatValue(user.lastName),
      userName: formatValue(user.userName),
      languageCode: formatValue(user.languageCode),
      isPremium: formatValue(user.isPremium),
      lastInteraction: formatDate(user.lastInteraction),
      interactionCount: formatValue(user.interactionCount),
      createdAt: formatDate(user.createdAt),
      // Преобразовать userData в строку JSON, если оно есть
      userData: user.userData ? JSON.stringify(user.userData) : '',
      // Добавляем поля для медиа-файлов
      photoUrls: photoUrls.join(', '), // Соединяем URL-адреса через запятую
      mediaUrls: mediaUrls.join(', '), // Соединяем URL-адреса через запятую
    };
  });
}