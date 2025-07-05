import { Node, Button } from '@/types/bot';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button as UIButton } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { validateCommand, getCommandSuggestions, STANDARD_COMMANDS } from '@/lib/commands';
import { useState, useMemo } from 'react';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  allNodes?: Node[];
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  onButtonAdd: (nodeId: string, button: Button) => void;
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  onButtonDelete: (nodeId: string, buttonId: string) => void;
}

export function PropertiesPanel({ 
  selectedNode,
  allNodes = [],
  onNodeUpdate, 
  onButtonAdd, 
  onButtonUpdate, 
  onButtonDelete 
}: PropertiesPanelProps) {
  const { toast } = useToast();
  const [commandInput, setCommandInput] = useState('');
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);

  // Валидация команды
  const commandValidation = useMemo(() => {
    if (selectedNode && (selectedNode.type === 'start' || selectedNode.type === 'command')) {
      return validateCommand(selectedNode.data.command || '');
    }
    return { isValid: true, errors: [] };
  }, [selectedNode?.data.command]);

  // Автодополнение команд
  const commandSuggestions = useMemo(() => {
    if (commandInput.length > 0) {
      return getCommandSuggestions(commandInput);
    }
    return STANDARD_COMMANDS.slice(0, 5);
  }, [commandInput]);
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
    <aside className="w-full h-full bg-background border-l border-border flex flex-col">
      {/* Properties Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${nodeColors[selectedNode.type]}`}>
            <i className={`${nodeIcons[selectedNode.type]} text-sm`}></i>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">{nodeTypeNames[selectedNode.type]}</h2>
            <div className="flex items-center mt-1">
              <span className="text-xs text-muted-foreground">ID:</span>
              <code className="ml-1 px-2 py-0.5 bg-muted rounded text-xs font-mono text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedNode.id);
                      toast({
                        title: "ID скопирован!",
                        description: `ID "${selectedNode.id}" скопирован в буфер обмена`,
                      });
                    }}
                    title="Нажмите, чтобы скопировать">
                {selectedNode.id}
              </code>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Настройте параметры выбранного элемента</p>
      </div>

      {/* Properties Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Basic Settings */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Основные настройки</h3>
          <div className="space-y-4">
            {(selectedNode.type === 'start' || selectedNode.type === 'command') && (
              <>
                <div className="relative">
                  <Label className="text-xs font-medium text-muted-foreground">Команда</Label>
                  <div className="relative">
                    <Input
                      value={selectedNode.data.command || ''}
                      onChange={(e) => {
                        onNodeUpdate(selectedNode.id, { command: e.target.value });
                        setCommandInput(e.target.value);
                        setShowCommandSuggestions(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowCommandSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCommandSuggestions(false), 200)}
                      className={`mt-2 ${!commandValidation.isValid ? 'border-red-500' : ''}`}
                      placeholder="/start"
                    />
                    
                    {/* Автодополнение команд */}
                    {showCommandSuggestions && commandSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                        {commandSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b border-border last:border-b-0"
                            onClick={() => {
                              onNodeUpdate(selectedNode.id, { 
                                command: suggestion.command,
                                description: suggestion.description 
                              });
                              setShowCommandSuggestions(false);
                            }}
                          >
                            <div className="font-medium text-foreground">{suggestion.command}</div>
                            <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Ошибки валидации */}
                  {!commandValidation.isValid && commandValidation.errors.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {commandValidation.errors.map((error, index) => (
                        <div key={index} className="flex items-center text-xs text-red-600">
                          <i className="fas fa-exclamation-circle mr-1"></i>
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Описание</Label>
                  <Input
                    value={selectedNode.data.description || ''}
                    onChange={(e) => onNodeUpdate(selectedNode.id, { description: e.target.value })}
                    className="mt-2"
                    placeholder="Описание команды"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Используется для меню команд в @BotFather
                  </div>
                </div>
              </>
            )}

            {selectedNode.type === 'photo' && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground">URL изображения</Label>
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
          <h3 className="text-sm font-medium text-foreground mb-3">Содержимое сообщения</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Текст сообщения</Label>
              <Textarea
                value={selectedNode.data.messageText || ''}
                onChange={(e) => onNodeUpdate(selectedNode.id, { messageText: e.target.value })}
                className="mt-2 h-24 resize-none"
                placeholder="Введите текст сообщения..."
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Поддержка Markdown</Label>
              <Switch
                checked={selectedNode.data.markdown}
                onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { markdown: checked })}
              />
            </div>
          </div>
        </div>

        {/* Keyboard Settings */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Клавиатура</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Тип клавиатуры</Label>
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
                  <Label className="text-xs font-medium text-muted-foreground">Кнопки</Label>
                  <UIButton
                    size="sm"
                    variant="ghost"
                    onClick={handleAddButton}
                    className="text-xs text-primary hover:text-primary/80 font-medium h-auto p-1"
                  >
                    + Добавить
                  </UIButton>
                </div>
                
                <div className="space-y-2">
                  {selectedNode.data.buttons.map((button) => (
                    <div key={button.id} className="bg-muted/50 rounded-lg p-3">
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
                      
                      {button.action === 'command' && (
                        <div className="mt-2 space-y-2">
                          <Select
                            value={button.target || ''}
                            onValueChange={(value) => onButtonUpdate(selectedNode.id, button.id, { target: value })}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Выберите команду" />
                            </SelectTrigger>
                            <SelectContent>
                              {allNodes
                                .filter(node => (node.type === 'start' || node.type === 'command') && node.data.command)
                                .map((node) => (
                                  <SelectItem key={node.id} value={node.data.command!}>
                                    <div className="flex items-center space-x-2">
                                      <i className={`${node.type === 'start' ? 'fas fa-play' : 'fas fa-terminal'} text-xs`}></i>
                                      <span>{node.data.command}</span>
                                      {node.data.description && (
                                        <span className="text-gray-500">- {node.data.description}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              {STANDARD_COMMANDS.map((cmd) => (
                                <SelectItem key={cmd.command} value={cmd.command}>
                                  <div className="flex items-center space-x-2">
                                    <i className="fas fa-lightbulb text-yellow-500 text-xs"></i>
                                    <span>{cmd.command}</span>
                                    <span className="text-gray-500">- {cmd.description}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Input
                            value={button.target || ''}
                            onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { target: e.target.value })}
                            className="text-xs"
                            placeholder="Или введите команду вручную (например: /help)"
                          />
                          
                          {button.target && !button.target.startsWith('/') && (
                            <div className="flex items-center text-xs text-amber-600 bg-amber-50 p-2 rounded">
                              <i className="fas fa-exclamation-triangle mr-2"></i>
                              <span>Команда должна начинаться с символа "/"</span>
                            </div>
                          )}
                        </div>
                      )}

                      {button.action === 'goto' && (
                        <div className="mt-2 space-y-2">
                          <Select
                            value={button.target || ''}
                            onValueChange={(value) => onButtonUpdate(selectedNode.id, button.id, { target: value })}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Выберите экран" />
                            </SelectTrigger>
                            <SelectContent>
                              {allNodes
                                .filter(node => node.id !== selectedNode.id)
                                .map((node) => {
                                  const nodeName = 
                                    node.type === 'start' ? node.data.command :
                                    node.type === 'command' ? node.data.command :
                                    node.type === 'message' ? 'Сообщение' :
                                    node.type === 'photo' ? 'Фото' :
                                    node.type === 'keyboard' ? 'Клавиатура' :
                                    node.type === 'condition' ? 'Условие' :
                                    node.type === 'input' ? 'Ввод' : 'Узел';
                                  
                                  return (
                                    <SelectItem key={node.id} value={node.id}>
                                      {nodeName} ({node.id})
                                    </SelectItem>
                                  );
                                })}
                              {allNodes.filter(node => node.id !== selectedNode.id).length === 0 && (
                                <SelectItem value="no-nodes" disabled>
                                  Создайте другие экраны для выбора
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          
                          <Input
                            value={button.target || ''}
                            onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { target: e.target.value })}
                            className="text-xs"
                            placeholder="Или введите ID вручную"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Command Advanced Settings */}
        {(selectedNode.type === 'start' || selectedNode.type === 'command') && (
          <Accordion type="single" collapsible>
            <AccordionItem value="advanced-settings">
              <AccordionTrigger className="text-sm font-medium text-gray-900 hover:no-underline">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-cogs text-gray-500 text-xs"></i>
                  <span>Расширенные настройки команды</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Показать в меню</Label>
                      <div className="text-xs text-gray-500">Команда появится в меню @BotFather</div>
                    </div>
                    <Switch
                      checked={selectedNode.data.showInMenu ?? true}
                      onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { showInMenu: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Только в приватных чатах</Label>
                      <div className="text-xs text-gray-500">Команда работает только в диалоге с ботом</div>
                    </div>
                    <Switch
                      checked={selectedNode.data.isPrivateOnly ?? false}
                      onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { isPrivateOnly: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Требует авторизации</Label>
                      <div className="text-xs text-gray-500">Пользователь должен быть зарегистрирован</div>
                    </div>
                    <Switch
                      checked={selectedNode.data.requiresAuth ?? false}
                      onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { requiresAuth: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Только для администраторов</Label>
                      <div className="text-xs text-gray-500">Команда доступна только админам</div>
                    </div>
                    <Switch
                      checked={selectedNode.data.adminOnly ?? false}
                      onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { adminOnly: checked })}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <Separator />

        {/* Advanced Settings */}
        {selectedNode.data.keyboardType === 'reply' && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Настройки клавиатуры</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Одноразовая клавиатура</Label>
                  <div className="text-xs text-gray-500">Скрыть после нажатия</div>
                </div>
                <Switch
                  checked={selectedNode.data.oneTimeKeyboard}
                  onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { oneTimeKeyboard: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Изменить размер клавиатуры</Label>
                  <div className="text-xs text-gray-500">Подогнать под содержимое</div>
                </div>
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
