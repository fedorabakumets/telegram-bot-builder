import { Node, Button } from '@/types/bot';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button as UIButton } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { nanoid } from 'nanoid';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  onButtonAdd: (nodeId: string, button: Button) => void;
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  onButtonDelete: (nodeId: string, buttonId: string) => void;
}

export function PropertiesPanel({ 
  selectedNode, 
  onNodeUpdate, 
  onButtonAdd, 
  onButtonUpdate, 
  onButtonDelete 
}: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Свойства</h2>
          <p className="text-xs text-gray-500 mt-1">Выберите элемент для настройки</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-cog text-gray-400 text-xl"></i>
            </div>
            <p className="text-sm text-gray-500">Нет выбранного элемента</p>
          </div>
        </div>
      </aside>
    );
  }

  const nodeTypeNames = {
    start: '/start команда',
    command: 'Пользовательская команда',
    message: 'Текстовое сообщение',
    photo: 'Фото с текстом',
    keyboard: 'Клавиатура',
    condition: 'Условие',
    input: 'Ввод данных'
  };

  const nodeIcons = {
    start: 'fas fa-play',
    command: 'fas fa-terminal',
    message: 'fas fa-comment',
    photo: 'fas fa-image',
    keyboard: 'fas fa-keyboard',
    condition: 'fas fa-code-branch',
    input: 'fas fa-edit'
  };

  const nodeColors = {
    start: 'bg-green-100 text-green-600',
    command: 'bg-indigo-100 text-indigo-600',
    message: 'bg-blue-100 text-blue-600',
    photo: 'bg-purple-100 text-purple-600',
    keyboard: 'bg-amber-100 text-amber-600',
    condition: 'bg-red-100 text-red-600',
    input: 'bg-cyan-100 text-cyan-600'
  };

  const handleAddButton = () => {
    const newButton: Button = {
      id: nanoid(),
      text: 'Новая кнопка',
      action: 'goto',
      target: ''
    };
    onButtonAdd(selectedNode.id, newButton);
  };

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Properties Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${nodeColors[selectedNode.type]}`}>
            <i className={`${nodeIcons[selectedNode.type]} text-sm`}></i>
          </div>
          <h2 className="text-sm font-semibold text-gray-900">{nodeTypeNames[selectedNode.type]}</h2>
        </div>
        <p className="text-xs text-gray-500">Настройте параметры выбранного элемента</p>
      </div>

      {/* Properties Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Basic Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Основные настройки</h3>
          <div className="space-y-4">
            {(selectedNode.type === 'start' || selectedNode.type === 'command') && (
              <>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Команда</Label>
                  <Input
                    value={selectedNode.data.command || ''}
                    onChange={(e) => onNodeUpdate(selectedNode.id, { command: e.target.value })}
                    className="mt-2"
                    placeholder="/start"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Описание</Label>
                  <Input
                    value={selectedNode.data.description || ''}
                    onChange={(e) => onNodeUpdate(selectedNode.id, { description: e.target.value })}
                    className="mt-2"
                    placeholder="Описание команды"
                  />
                </div>
              </>
            )}

            {selectedNode.type === 'photo' && (
              <div>
                <Label className="text-xs font-medium text-gray-700">URL изображения</Label>
                <Input
                  value={selectedNode.data.imageUrl || ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { imageUrl: e.target.value })}
                  className="mt-2"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Содержимое сообщения</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-gray-700">Текст сообщения</Label>
              <Textarea
                value={selectedNode.data.messageText || ''}
                onChange={(e) => onNodeUpdate(selectedNode.id, { messageText: e.target.value })}
                className="mt-2 h-24 resize-none"
                placeholder="Введите текст сообщения..."
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700">Поддержка Markdown</Label>
              <Switch
                checked={selectedNode.data.markdown}
                onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { markdown: checked })}
              />
            </div>
          </div>
        </div>

        {/* Keyboard Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Клавиатура</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-gray-700">Тип клавиатуры</Label>
              <Select
                value={selectedNode.data.keyboardType}
                onValueChange={(value: 'reply' | 'inline' | 'none') => 
                  onNodeUpdate(selectedNode.id, { keyboardType: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reply">Reply клавиатура</SelectItem>
                  <SelectItem value="inline">Inline кнопки</SelectItem>
                  <SelectItem value="none">Без клавиатуры</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Buttons List */}
            {selectedNode.data.keyboardType !== 'none' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium text-gray-700">Кнопки</Label>
                  <UIButton
                    size="sm"
                    variant="ghost"
                    onClick={handleAddButton}
                    className="text-xs text-primary hover:text-blue-700 font-medium h-auto p-1"
                  >
                    + Добавить
                  </UIButton>
                </div>
                
                <div className="space-y-2">
                  {selectedNode.data.buttons.map((button) => (
                    <div key={button.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={button.text}
                          onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { text: e.target.value })}
                          className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Текст кнопки"
                        />
                        <UIButton
                          size="sm"
                          variant="ghost"
                          onClick={() => onButtonDelete(selectedNode.id, button.id)}
                          className="text-gray-400 hover:text-red-500 h-auto p-1"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </UIButton>
                      </div>
                      <Select
                        value={button.action}
                        onValueChange={(value: 'goto' | 'command' | 'url') =>
                          onButtonUpdate(selectedNode.id, button.id, { action: value })
                        }
                      >
                        <SelectTrigger className="w-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="goto">Перейти к экрану</SelectItem>
                          <SelectItem value="command">Выполнить команду</SelectItem>
                          <SelectItem value="url">Открыть ссылку</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {button.action === 'url' && (
                        <Input
                          value={button.url || ''}
                          onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { url: e.target.value })}
                          className="mt-2 text-xs"
                          placeholder="https://example.com"
                        />
                      )}
                      
                      {button.action === 'goto' && (
                        <Input
                          value={button.target || ''}
                          onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { target: e.target.value })}
                          className="mt-2 text-xs"
                          placeholder="ID экрана"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Settings */}
        {selectedNode.data.keyboardType === 'reply' && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Дополнительно</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700">Одноразовая клавиатура</Label>
                <Switch
                  checked={selectedNode.data.oneTimeKeyboard}
                  onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { oneTimeKeyboard: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700">Изменить размер клавиатуры</Label>
                <Switch
                  checked={selectedNode.data.resizeKeyboard}
                  onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { resizeKeyboard: checked })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Properties Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <UIButton 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              // Reset to default values
              onNodeUpdate(selectedNode.id, {
                messageText: '',
                keyboardType: 'none',
                buttons: [],
                markdown: false,
                oneTimeKeyboard: false,
                resizeKeyboard: true
              });
            }}
          >
            Сбросить
          </UIButton>
          <UIButton className="flex-1">
            Применить
          </UIButton>
        </div>
      </div>
    </aside>
  );
}
