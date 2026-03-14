/**
 * Функция для генерации Python-функций работы с картографическими сервисами
 * 
 * Эта функция возвращает строку, содержащую полноценный модуль на языке Python,
 * предназначенный для извлечения, валидации и обработки географических координат
 * из URL-адресов различных картографических сервисов (Яндекс.Карты, Google Maps, 2ГИС, OpenStreetMap).
 * Также реализованы функции генерации ссылок, вычисления расстояний и поиска ближайших точек.
 * 
 * @returns Строка с кодом Python-модуля для работы с картографическими сервисами
 * 
 * @example
 * const pythonCode = generateLocationFunctions();
 * console.log(pythonCode); // Выведет сгенерированный Python-код
 */
export function generateLocationFunctions(): string {
  const codeParts: string[] = [];

  codeParts.push(`
# Функции для работы с картографическими сервисами
import re
import urllib.parse
import logging
from typing import Tuple, Dict, Optional, List, Union
from dataclasses import dataclass
from functools import lru_cache

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logging.getLogger("asyncpg").setLevel(logging.CRITICAL)

@dataclass
class CoordinateBounds:
    """Границы валидных координат
    
    Определяет допустимые диапазоны широты и долготы на Земле.
    
    @property min_lat - Минимальная широта (-90.0)
    @property max_lat - Максимальная широта (90.0)
    @property min_lon - Минимальная долгота (-180.0)
    @property max_lon - Максимальная долгота (180.0)
    """
    min_lat: float = -90.0
    max_lat: float = 90.0
    min_lon: float = -180.0
    max_lon: float = 180.0

@dataclass
class LocationData:
    """Структура данных о местоположении
    
    Содержит информацию о координатах, источнике данных и степени уверенности.
    
    @property latitude - Широта точки (может быть null)
    @property longitude - Долгота точки (может быть null)
    @property service - Название картографического сервиса (например, 'yandex')
    @property confidence - Уровень уверенности в точности данных (от 0.0 до 1.0)
    """
    latitude: Optional[float]
    longitude: Optional[float]
    service: Optional[str]
    confidence: float = 0.0

# Константы
VALID_BOUNDS = CoordinateBounds()
SUPPORTED_SERVICES = ['yandex', 'google', '2gis', 'openstreetmap']

def _validate_coordinates(lat: float, lon: float) -> bool:
    """Проверяет валидность координат
    
    Проверяет, находятся ли переданные координаты в допустимых пределах.
    
    @param lat - Широта в градусах
    @param lon - Долгота в градусах
    @returns True, если координаты валидны, иначе False
    """
    return (VALID_BOUNDS.min_lat <= lat <= VALID_BOUNDS.max_lat and 
            VALID_BOUNDS.min_lon <= lon <= VALID_BOUNDS.max_lon)

def _extract_coordinates_from_pattern(url: str, pattern: str, lat_group: int = 1, lon_group: int = 2) -> Tuple[Optional[float], Optional[float]]:
    """Универсальная функция для извлечения координат по регулярному выражению
    
    Использует регулярное выражение для поиска координат в URL.
    Выполняет проверку валидности извлеченных координат.
    
    @param url - URL-адрес для анализа
    @param pattern - Регулярное выражение для поиска координат
    @param lat_group - Номер группы в регулярном выражении, содержащей широту
    @param lon_group - Номер группы в регулярном выражении, содержащей долготу
    @returns Кортеж из широты и долготы (или None, если не найдены или невалидны)
    """
    try:
        match = re.search(pattern, url)
        if match:
            lat = float(match.group(lat_group))
            lon = float(match.group(lon_group))
            if _validate_coordinates(lat, lon):
                return lat, lon
            else:
                logger.warning(f"Координаты вне допустимых границ: {lat}, {lon}")
        return None, None
    except (ValueError, IndexError) as e:
        logger.error(f"Ошибка при извлечении координат: {e}")
        return None, None

@lru_cache(maxsize=128)
def _clean_url(url: str) -> str:
    """Очищает URL от лишних параметров для кэширования
    
    Преобразует URL к нижнему регистру и удаляет пробелы.
    Используется как препроцессинг перед анализом ссылки.
    
    @param url - Исходный URL
    @returns Очищенный URL
    """
    return url.strip().lower()

def extract_coordinates_from_yandex(url: str) -> LocationData:
    """Извлекает координаты из ссылки Яндекс.Карт
    
    Поддерживает несколько форматов URL Яндекс.Карт:
    - ll=longitude,latitude
    - /longitude,latitude/
    - pt=longitude,latitude
    
    @param url - URL Яндекс.Карт
    @returns Объект LocationData с извлеченными данными
    """
    url = _clean_url(url)
    
    # Формат: ll=longitude,latitude
    lat, lon = _extract_coordinates_from_pattern(url, r"ll=([\\d.-]+),([\\d.-]+)", 2, 1)
    if lat is not None:
        return LocationData(lat, lon, 'yandex', 0.9)
    
    # Формат: /longitude,latitude/
    lat, lon = _extract_coordinates_from_pattern(url, r"/([\\d.-]+),([\\d.-]+)/", 2, 1)
    if lat is not None:
        return LocationData(lat, lon, 'yandex', 0.7)
    
    # Формат: ?pt=longitude,latitude
    lat, lon = _extract_coordinates_from_pattern(url, r"pt=([\\d.-]+),([\\d.-]+)", 2, 1)
    if lat is not None:
        return LocationData(lat, lon, 'yandex', 0.8)
    
    return LocationData(None, None, 'yandex', 0.0)

def extract_coordinates_from_google(url: str) -> LocationData:
    """Извлекает координаты из ссылки Google Maps
    
    Поддерживает несколько форматов URL Google Maps:
    - @latitude,longitude
    - ?q=latitude,longitude
    - /latitude,longitude/
    
    @param url - URL Google Maps
    @returns Объект LocationData с извлеченными данными
    """
    url = _clean_url(url)
    
    # Формат: @latitude,longitude
    lat, lon = _extract_coordinates_from_pattern(url, r"@([\\d.-]+),([\\d.-]+)")
    if lat is not None:
        return LocationData(lat, lon, 'google', 0.9)
    
    # Формат: ?q=latitude,longitude
    lat, lon = _extract_coordinates_from_pattern(url, r"q=([\\d.-]+),([\\d.-]+)")
    if lat is not None:
        return LocationData(lat, lon, 'google', 0.8)
    
    # Формат: /latitude,longitude/
    lat, lon = _extract_coordinates_from_pattern(url, r"/([\\d.-]+),([\\d.-]+)/")
    if lat is not None:
        return LocationData(lat, lon, 'google', 0.7)
    
    return LocationData(None, None, 'google', 0.0)

def extract_coordinates_from_2gis(url: str) -> LocationData:
    """Извлекает координаты из ссылки 2ГИС
    
    Поддерживает форматы URL 2ГИС:
    - center/longitude,latitude
    - /longitude,latitude/
    
    @param url - URL 2ГИС
    @returns Объект LocationData с извлеченными данными
    """
    url = _clean_url(url)
    
    # Формат: center/longitude,latitude
    lat, lon = _extract_coordinates_from_pattern(url, r"center/([\\d.-]+),([\\d.-]+)", 2, 1)
    if lat is not None:
        return LocationData(lat, lon, '2gis', 0.9)
    
    # Формат: /longitude,latitude/
    lat, lon = _extract_coordinates_from_pattern(url, r"/([\\d.-]+),([\\d.-]+)/", 2, 1)
    if lat is not None:
        return LocationData(lat, lon, '2gis', 0.8)
    
    return LocationData(None, None, '2gis', 0.0)

@lru_cache(maxsize=256)
def extract_coordinates_universal(url: str, service_hint: Optional[str] = None) -> LocationData:
    """Универсальное извлечение координат из любого сервиса
    
    Пытается определить координаты из URL, используя подсказку о сервисе
    или перебирая все поддерживаемые сервисы в порядке приоритета.
    
    @param url - URL картографического сервиса
    @param service_hint - Подсказка о названии сервиса (необязательно)
    @returns Объект LocationData с наилучшими найденными данными
    """
    if service_hint and service_hint in SUPPORTED_SERVICES:
        extractors = {
            'yandex': extract_coordinates_from_yandex,
            'google': extract_coordinates_from_google,
            '2gis': extract_coordinates_from_2gis
        }
        return extractors[service_hint](url)
    
    # Пробуем все сервисы в порядке приоритета
    extractors = [
        extract_coordinates_from_yandex,
        extract_coordinates_from_google,
        extract_coordinates_from_2gis
    ]
    
    best_result = LocationData(None, None, None, 0.0)
    
    for extractor in extractors:
        result = extractor(url)
        if result.confidence > best_result.confidence:
            best_result = result
    
    logger.info(f"Извлечены координаты: {best_result.latitude}, {best_result.longitude} "
               f"из сервиса {best_result.service} с уверенностью {best_result.confidence}")
    
    return best_result

def validate_and_format_coordinates(latitude: Union[float, str], longitude: Union[float, str]) -> Tuple[Optional[float], Optional[float]]:
    """Валидирует и форматирует координаты
    
    Преобразует входные значения к числам, проверяет их валидность
    и округляет до 6 знаков после запятой (~1 метр точности).
    
    @param latitude - Широта (строка или число)
    @param longitude - Долгота (строка или число)
    @returns Кортеж из валидных и отформатированных координат или (None, None)
    """
    try:
        lat = float(latitude)
        lon = float(longitude)
        
        if not _validate_coordinates(lat, lon):
            logger.warning(f"Координаты вне допустимых границ: {lat}, {lon}")
            return None, None
        
        # Округляем до 6 знаков после запятой (примерно 1 метр точности)
        return round(lat, 6), round(lon, 6)
    except (ValueError, TypeError) as e:
        logger.error(f"Ошибка валидации координат: {e}")
        return None, None

def generate_map_urls(latitude: float, longitude: float, title: str = "", 
                     include_additional: bool = True) -> Dict[str, str]:
    """Генерирует ссылки на различные картографические сервисы
    
    Создаёт набор URL-адресов для просмотра заданной точки на разных картах.
    
    @param latitude - Широта точки
    @param longitude - Долгота точки
    @param title - Необязательное название места (будет закодировано в URL)
    @param include_additional - Включать ли дополнительные типы карт (спутник, панорамы)
    @returns Словарь с названиями сервисов и соответствующими URL
    """
    lat, lon = validate_and_format_coordinates(latitude, longitude)
    if lat is None or lon is None:
        return {}
    
    encoded_title = urllib.parse.quote(title) if title else ""
    
    urls = {
        "yandex": f"https://yandex.ru/maps/?ll={lon},{lat}&z=15&l=map&pt={lon},{lat}",
        "google": f"https://maps.google.com/?q={lat},{lon}",
        "2gis": f"https://2gis.ru/geo/{lon},{lat}",
        "openstreetmap": f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}&zoom=15"
    }
    
    # Дополнительные сервисы
    if include_additional:
        urls.update({
            "osm_terrain": f"https://www.openstreetmap.org/#map=15/{lat}/{lon}",
            "yandex_satellite": f"https://yandex.ru/maps/?ll={lon},{lat}&z=15&l=sat",
            "google_satellite": f"https://maps.google.com/?q={lat},{lon}&t=k",
            "google_street_view": f"https://maps.google.com/?cbll={lat},{lon}&cbp=12,0,0,0,0",
            "yandex_panorama": f"https://yandex.ru/maps/?ll={lon},{lat}&z=16&l=pmap"
        })
    
    # Добавляем заголовок к URL если он есть
    if encoded_title:
        urls["google_with_title"] = f"https://maps.google.com/?q={lat},{lon}&query={encoded_title}"
    
    return urls

def get_location_info(url: str, include_urls: bool = True) -> Dict[str, Union[Optional[float], Dict[str, str], str, float]]:
    """Получает полную информацию о местоположении из URL карты
    
    Анализирует URL и возвращает все доступные данные о координатах,
    источнике и дополнительных ссылках.
    
    @param url - URL картографического сервиса
    @param include_urls - Нужно ли включать сгенерированные ссылки на другие сервисы
    @returns Словарь с информацией о местоположении
    """
    location_data = extract_coordinates_universal(url)
    
    result = {
        "latitude": location_data.latitude,
        "longitude": location_data.longitude,
        "service": location_data.service,
        "confidence": location_data.confidence,
        "is_valid": location_data.latitude is not None and location_data.longitude is not None
    }
    
    if include_urls and location_data.latitude and location_data.longitude:
        result["urls"] = generate_map_urls(location_data.latitude, location_data.longitude)
    
    return result

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Вычисляет расстояние между двумя точками в километрах (формула Хаверсина)
    
    Реализует математическую формулу для расчёта расстояния по дуге большого круга.
    
    @param lat1 - Широта первой точки
    @param lon1 - Долгота первой точки
    @param lat2 - Широта второй точки
    @param lon2 - Долгота второй точки
    @returns Расстояние в километрах
    """
    import math
    
    R = 6371  # Радиус Земли в км
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def find_nearest_service_point(target_lat: float, target_lon: float, 
                               points: List[Dict[str, Union[str, float]]]) -> Optional[Dict[str, Union[str, float]]]:
    """Находит ближайшую точку из списка к заданным координатам
    
    Перебирает список точек и определяет, какая из них расположена ближе всего
    к целевой точке. Добавляет расстояние в результат.
    
    @param target_lat - Широта целевой точки
    @param target_lon - Долгота целевой точки
    @param points - Список точек для анализа (каждая содержит latitude и longitude)
    @returns Точка, ближайшая к целевой, с добавленным расстоянием, или None
    """
    if not points:
        return None
    
    nearest_point = None
    min_distance = float('inf')
    
    for point in points:
        try:
            point_lat = float(point.get('latitude', 0))
            point_lon = float(point.get('longitude', 0))
            
            distance = calculate_distance(target_lat, target_lon, point_lat, point_lon)
            
            if distance < min_distance:
                min_distance = distance
                nearest_point = point
        except (ValueError, TypeError):
            continue
    
    if nearest_point:
        nearest_point['distance_km'] = round(min_distance, 2)
    
    return nearest_point
`);

  return codeParts.join('');
}
