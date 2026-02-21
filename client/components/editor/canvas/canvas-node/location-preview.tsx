/**
 * @fileoverview Компонент превью для узла типа "Геолокация"
 * 
 * Отображает визуальное представление геолокации с иконкой,
 * названием сервиса, координатами, адресом и дополнительной информацией.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента LocationPreview
 *
 * @interface LocationPreviewProps
 * @property {Node} node - Узел типа location для отображения
 */
interface LocationPreviewProps {
  node: Node;
}

/**
 * Компонент превью геолокации
 *
 * @component
 * @description Отображает превью узла с геолокацией
 *
 * @param {LocationPreviewProps} props - Свойства компонента
 * @param {Node} props.node - Узел типа location
 *
 * @returns {JSX.Element} Компонент превью геолокации
 */
export function LocationPreview({ node }: LocationPreviewProps) {
  return (
    <div className="bg-gradient-to-br from-green-100/50 to-lime-100/50 dark:from-green-900/30 dark:to-lime-900/30 rounded-lg p-3 mb-4 flex flex-col justify-center space-y-2">
      <div className="flex items-center justify-center space-x-2">
        <i className="fas fa-map-marker-alt text-green-400 dark:text-green-300 text-2xl"></i>
        {node.data.mapService && node.data.mapService !== 'custom' && (
          <div className="flex items-center space-x-1">
            {node.data.mapService === 'yandex' && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full font-medium border border-yellow-200 dark:border-yellow-800">
                Яндекс
              </span>
            )}
            {node.data.mapService === 'google' && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                Google
              </span>
            )}
            {node.data.mapService === '2gis' && (
              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium border border-green-200 dark:border-green-800">
                2ГИС
              </span>
            )}
          </div>
        )}
      </div>

      <div className="text-xs text-green-600 dark:text-green-400 space-y-1 text-center">
        <div className="font-medium text-sm">{node.data.title || 'Геолокация'}</div>

        {node.data.latitude && node.data.longitude && (
          <div className="flex items-center justify-center space-x-1">
            <i className="fas fa-crosshairs text-xs"></i>
            <span className="font-mono text-xs">
              {parseFloat(String(node.data.latitude)).toFixed(4)}, {parseFloat(String(node.data.longitude)).toFixed(4)}
            </span>
          </div>
        )}

        {node.data.address && (
          <div className="flex items-center justify-center space-x-1">
            <i className="fas fa-map text-xs"></i>
            <span className="truncate max-w-32 text-xs">{node.data.address}</span>
          </div>
        )}

        {(node.data.yandexMapUrl || node.data.googleMapUrl || node.data.gisMapUrl) && (
          <div className="flex items-center justify-center space-x-1">
            <i className="fas fa-link text-xs text-green-500"></i>
            <span className="text-xs opacity-75">URL загружен</span>
          </div>
        )}

        {node.data.generateMapPreview && (
          <div className="flex items-center justify-center space-x-1">
            <i className="fas fa-external-link-alt text-xs text-blue-500"></i>
            <span className="text-xs opacity-75">Кнопки карт</span>
          </div>
        )}
      </div>
    </div>
  );
}
