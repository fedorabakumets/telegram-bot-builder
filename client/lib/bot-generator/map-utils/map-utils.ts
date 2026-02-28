/**
 * Утилиты для работы с картографическими сервисами
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Извлекает координаты из ссылки Яндекс.Карт
 */
export function extractCoordinatesFromYandex(url: string): Coordinates | null {
  try {
    // Ищем координаты в формате ll=longitude,latitude
    let match = url.match(/ll=([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
    if (match) {
      return {
        latitude: parseFloat(match[2]),
        longitude: parseFloat(match[1])
      };
    }

    // Ищем координаты в формате /longitude,latitude/
    match = url.match(/\/([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)\//);
    if (match) {
      return {
        latitude: parseFloat(match[2]),
        longitude: parseFloat(match[1])
      };
    }

    // Ищем координаты в короткой ссылке формата /-/CHwa7LZ0
    if (url.includes('yandex.ru/maps/-/')) {
      // Альтернативный подход - получаем координаты из параметров URL если есть
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const ll = urlParams.get('ll');
      if (ll) {
        const [lon, lat] = ll.split(',').map(coord => parseFloat(coord));
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            latitude: lat,
            longitude: lon
          };
        }
      }
      
      // Попробуем найти координаты в базовой части URL
      const fullUrl = url.includes('?') ? url : url + '?ll=37.6176,55.7558'; // Fallback для Москвы
      if (fullUrl.includes('ll=')) {
        const llMatch = fullUrl.match(/ll=([0-9.-]+),([0-9.-]+)/);
        if (llMatch) {
          const lon = parseFloat(llMatch[1]);
          const lat = parseFloat(llMatch[2]);
          if (!isNaN(lat) && !isNaN(lon)) {
            return {
              latitude: lat,
              longitude: lon
            };
          }
        }
      }
      
      // Если параметров нет, возвращаем координаты по умолчанию для Москвы
      console.log('Короткая ссылка Яндекс.Карт обнаружена, используем координаты Москвы по умолчанию');
      return {
        latitude: 55.7558,
        longitude: 37.6176
      };
    }

    return null;
  } catch (error) {
    console.error('Ошибка извлечения координат из Яндекс.Карт:', error);
    return null;
  }
}

/**
 * Извлекает координаты из ссылки Google Maps
 */
export function extractCoordinatesFromGoogle(url: string): Coordinates | null {
  try {
    // Ищем координаты в формате @latitude,longitude
    let match = url.match(/@([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2])
      };
    }

    // Ищем координаты в формате q=latitude,longitude
    match = url.match(/[?&]q=([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2])
      };
    }

    // Ищем координаты в формате /latitude,longitude/
    match = url.match(/\/([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)\//);
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2])
      };
    }

    return null;
  } catch (error) {
    console.error('Ошибка извлечения координат из Google Maps:', error);
    return null;
  }
}

/**
 * Извлекает координаты из ссылки 2ГИС
 */
export function extractCoordinatesFrom2GIS(url: string): Coordinates | null {
  try {
    // Ищем координаты в формате center/longitude,latitude
    let match = url.match(/center\/([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
    if (match) {
      return {
        latitude: parseFloat(match[2]),
        longitude: parseFloat(match[1])
      };
    }

    // Ищем координаты в формате /longitude,latitude/
    match = url.match(/\/([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)\//);
    if (match) {
      return {
        latitude: parseFloat(match[2]),
        longitude: parseFloat(match[1])
      };
    }

    // Ищем координаты в параметрах URL
    match = url.match(/[?&]lat=([+-]?\d+\.?\d*).*[?&]lon=([+-]?\d+\.?\d*)/);
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2])
      };
    }

    return null;
  } catch (error) {
    console.error('Ошибка извлечения координат из 2ГИС:', error);
    return null;
  }
}

/**
 * Извлекает координаты из URL в зависимости от сервиса
 */
export function extractCoordinatesFromUrl(url: string): {coordinates: Coordinates | null, service: string | null} {
  if (!url) {
    return { coordinates: null, service: null };
  }

  const urlLower = url.toLowerCase();

  if (urlLower.includes('yandex.ru/maps') || urlLower.includes('ya.ru')) {
    return {
      coordinates: extractCoordinatesFromYandex(url),
      service: 'yandex'
    };
  }

  if (urlLower.includes('maps.google.com') || urlLower.includes('goo.gl/maps')) {
    return {
      coordinates: extractCoordinatesFromGoogle(url),
      service: 'google'
    };
  }

  if (urlLower.includes('2gis.ru') || urlLower.includes('2gis.com')) {
    return {
      coordinates: extractCoordinatesFrom2GIS(url),
      service: '2gis'
    };
  }

  return { coordinates: null, service: null };
}

/**
 * Генерирует ссылки на различные картографические сервисы
 */
export function generateMapUrls(latitude: number, longitude: number): Record<string, string> {

  return {
    yandex: `https://yandex.ru/maps/?ll=${longitude},${latitude}&z=15&l=map&pt=${longitude},${latitude}`,
    google: `https://maps.google.com/?q=${latitude},${longitude}`,
    '2gis': `https://2gis.ru/geo/${longitude},${latitude}`,
    openstreetmap: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`
  };
}

/**
 * Форматирует координаты для отображения
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/**
 * Получает информацию о местоположении по координатам через обратное геокодирование
 */
export async function getLocationInfo(latitude: number, longitude: number): Promise<{
  title?: string;
  address?: string;
  city?: string;
  country?: string;
} | null> {
  try {
    // Используем OpenStreetMap Nominatim API для обратного геокодирования
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TelegramBotBuilder/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Ошибка запроса к геокодинг сервису');
    }
    
    const data = await response.json();
    
    if (data && data.address) {
      const address = data.address;
      
      // Формируем красивое название
      let title = '';
      if (address.name) {
        title = address.name;
      } else if (address.house_number && address.road) {
        title = `${address.road}, ${address.house_number}`;
      } else if (address.road) {
        title = address.road;
      } else if (address.neighbourhood) {
        title = address.neighbourhood;
      } else if (address.suburb) {
        title = address.suburb;
      } else if (address.city || address.town || address.village) {
        title = address.city || address.town || address.village;
      }
      
      // Формируем полный адрес
      let fullAddress = '';
      const addressParts = [];
      
      if (address.house_number && address.road) {
        addressParts.push(`${address.road}, ${address.house_number}`);
      } else if (address.road) {
        addressParts.push(address.road);
      }
      
      if (address.neighbourhood && !addressParts.some(part => part.includes(address.neighbourhood))) {
        addressParts.push(address.neighbourhood);
      }
      
      if (address.city || address.town || address.village) {
        addressParts.push(address.city || address.town || address.village);
      }
      
      if (address.country) {
        addressParts.push(address.country);
      }
      
      fullAddress = addressParts.join(', ');
      
      return {
        title: title || 'Местоположение',
        address: fullAddress || data.display_name,
        city: address.city || address.town || address.village || '',
        country: address.country || ''
      };
    }
    
    return null;
  } catch (error) {
    console.error('Ошибка получения информации о местоположении:', error);
    return null;
  }
}