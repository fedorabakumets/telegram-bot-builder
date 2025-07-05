import { ComponentDefinition } from '@/types/bot';
import { cn } from '@/lib/utils';

interface ComponentsSidebarProps {
  onComponentDrag: (component: ComponentDefinition) => void;
}

const components: ComponentDefinition[] = [
  {
    id: 'text-message',
    name: 'Текстовое сообщение',
    description: 'Обычный текст или Markdown',
    icon: 'fas fa-comment',
    color: 'bg-blue-100 text-blue-600',
    type: 'message',
    defaultData: {
      messageText: 'Новое сообщение',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'photo-message',
    name: 'Фото с текстом',
    description: 'Изображение + описание',
    icon: 'fas fa-image',
    color: 'bg-green-100 text-green-600',
    type: 'photo',
    defaultData: {
      messageText: 'Описание изображения',
      imageUrl: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'reply-keyboard',
    name: 'Reply клавиатура',
    description: 'Кнопки внизу экрана',
    icon: 'fas fa-keyboard',
    color: 'bg-purple-100 text-purple-600',
    type: 'keyboard',
    defaultData: {
      messageText: 'Выберите действие:',
      keyboardType: 'reply',
      buttons: [
        { id: 'btn-1', text: 'Кнопка 1', action: 'goto', target: '' },
        { id: 'btn-2', text: 'Кнопка 2', action: 'goto', target: '' }
      ],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'inline-keyboard',
    name: 'Inline кнопки',
    description: 'Кнопки под сообщением',
    icon: 'fas fa-mouse',
    color: 'bg-amber-100 text-amber-600',
    type: 'keyboard',
    defaultData: {
      messageText: 'Выберите действие:',
      keyboardType: 'inline',
      buttons: [
        { id: 'btn-1', text: 'Кнопка 1', action: 'goto', target: '' },
        { id: 'btn-2', text: 'Кнопка 2', action: 'goto', target: '' }
      ],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'condition',
    name: 'Условие',
    description: 'If/else логика',
    icon: 'fas fa-code-branch',
    color: 'bg-red-100 text-red-600',
    type: 'condition',
    defaultData: {
      messageText: 'Условие выполнено',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'user-input',
    name: 'Ввод данных',
    description: 'Сбор информации',
    icon: 'fas fa-edit',
    color: 'bg-cyan-100 text-cyan-600',
    type: 'input',
    defaultData: {
      messageText: 'Введите данные:',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'start-command',
    name: '/start команда',
    description: 'Точка входа в бота',
    icon: 'fas fa-play',
    color: 'bg-green-100 text-green-600',
    type: 'start',
    defaultData: {
      command: '/start',
      description: 'Запустить бота',
      messageText: 'Привет! Добро пожаловать!',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'custom-command',
    name: 'Пользовательская команда',
    description: 'Настраиваемая команда',
    icon: 'fas fa-terminal',
    color: 'bg-indigo-100 text-indigo-600',
    type: 'command',
    defaultData: {
      command: '/help',
      description: 'Помощь',
      messageText: 'Справка по боту',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  }
];

const componentCategories = [
  {
    title: 'Сообщения',
    components: components.filter(c => ['message', 'photo'].includes(c.type))
  },
  {
    title: 'Кнопки',
    components: components.filter(c => c.type === 'keyboard')
  },
  {
    title: 'Логика',
    components: components.filter(c => ['condition', 'input'].includes(c.type))
  },
  {
    title: 'Команды',
    components: components.filter(c => ['start', 'command'].includes(c.type))
  }
];

export function ComponentsSidebar({ onComponentDrag }: ComponentsSidebarProps) {
  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    onComponentDrag(component);
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Компоненты</h2>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button className="flex-1 px-3 py-1.5 text-xs font-medium bg-white text-gray-900 rounded-md shadow-sm">
            Элементы
          </button>
          <button className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900">
            Шаблоны
          </button>
        </div>
      </div>
      
      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {componentCategories.map((category) => (
          <div key={category.title}>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {category.title}
            </h3>
            <div className="space-y-2">
              {category.components.map((component) => (
                <div
                  key={component.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, component)}
                  className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-move transition-colors"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mr-3", component.color)}>
                    <i className={`${component.icon} text-sm`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{component.name}</p>
                    <p className="text-xs text-gray-500">{component.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
