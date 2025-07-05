import { Node } from '@/types/bot';
import { cn } from '@/lib/utils';

interface CanvasNodeProps {
  node: Node;
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

const nodeIcons = {
  start: 'fas fa-play',
  message: 'fas fa-comment',
  photo: 'fas fa-image',
  keyboard: 'fas fa-keyboard',
  condition: 'fas fa-code-branch',
  input: 'fas fa-edit',
  command: 'fas fa-terminal'
};

const nodeColors = {
  start: 'bg-green-100 text-green-600',
  message: 'bg-blue-100 text-blue-600',
  photo: 'bg-purple-100 text-purple-600',
  keyboard: 'bg-amber-100 text-amber-600',
  condition: 'bg-red-100 text-red-600',
  input: 'bg-cyan-100 text-cyan-600',
  command: 'bg-indigo-100 text-indigo-600'
};

export function CanvasNode({ node, isSelected, onClick, onDelete }: CanvasNodeProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-lg border p-6 w-80 cursor-pointer hover:shadow-xl transition-all relative",
        isSelected ? "border-2 border-primary" : "border border-gray-200"
      )}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y
      }}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <i className="fas fa-times text-xs"></i>
        </button>
      )}

      {/* Node header */}
      <div className="flex items-center mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-3", nodeColors[node.type])}>
          <i className={nodeIcons[node.type]}></i>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            {node.type === 'start' && node.data.command}
            {node.type === 'command' && node.data.command}
            {node.type === 'message' && 'Сообщение'}
            {node.type === 'photo' && 'Фото с текстом'}
            {node.type === 'keyboard' && 'Клавиатура'}
            {node.type === 'condition' && 'Условие'}
            {node.type === 'input' && 'Ввод данных'}
          </h3>
          <p className="text-xs text-gray-500">
            {node.data.description || 'Элемент бота'}
          </p>
        </div>
      </div>

      {/* Message preview */}
      {node.data.messageText && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700 line-clamp-3">
            {node.data.messageText}
          </p>
        </div>
      )}

      {/* Image preview */}
      {node.type === 'photo' && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
          {node.data.imageUrl ? (
            <img src={node.data.imageUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
          ) : (
            <i className="fas fa-image text-purple-300 text-3xl"></i>
          )}
        </div>
      )}

      {/* Buttons preview */}
      {node.data.buttons.length > 0 && (
        <div className="space-y-2">
          {node.data.keyboardType === 'inline' ? (
            <div className="grid grid-cols-2 gap-2">
              {node.data.buttons.slice(0, 4).map((button) => (
                <div key={button.id} className="p-2 bg-blue-50 rounded-lg text-xs font-medium text-blue-900 text-center border border-blue-200 relative">
                  <div className="flex items-center justify-center space-x-1">
                    <span>{button.text}</span>
                    {button.action === 'command' && (
                      <i className="fas fa-terminal text-green-600 text-xs" title="Команда"></i>
                    )}
                    {button.action === 'url' && (
                      <i className="fas fa-external-link-alt text-purple-600 text-xs" title="Ссылка"></i>
                    )}
                    {button.action === 'goto' && (
                      <i className="fas fa-arrow-right text-blue-600 text-xs" title="Переход"></i>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            node.data.buttons.slice(0, 2).map((button) => (
              <div key={button.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-900">{button.text}</span>
                <div className="flex items-center space-x-1">
                  {button.action === 'command' && (
                    <i className="fas fa-terminal text-green-600 text-xs" title="Команда"></i>
                  )}
                  {button.action === 'url' && (
                    <i className="fas fa-external-link-alt text-purple-600 text-xs" title="Ссылка"></i>
                  )}
                  {button.action === 'goto' && (
                    <i className="fas fa-arrow-right text-blue-600 text-xs" title="Переход"></i>
                  )}
                </div>
              </div>
            ))
          )}
          {node.data.buttons.length > (node.data.keyboardType === 'inline' ? 4 : 2) && (
            <div className="text-xs text-gray-500 text-center">
              +{node.data.buttons.length - (node.data.keyboardType === 'inline' ? 4 : 2)} еще
            </div>
          )}
        </div>
      )}

      {/* Connection points */}
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-300 rounded-full border-2 border-white shadow-md"></div>
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md"></div>
    </div>
  );
}
