import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Link, 
  Type,
  Eye,
  Copy,
  Sparkles,
  Palette,
  List,
  ListOrdered,
  Quote,
  Hash,
  Smile,
  RotateCcw,
  RotateCw,
  WrapText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Font,
  Search,
  Save,
  Download,
  Upload,
  Settings,
  Zap,
  Star,
  Heart,
  CheckSquare,
  Code2,
  Maximize,
  Minimize,
  AlertTriangle,
  Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  enableMarkdown?: boolean;
  onMarkdownToggle?: (enabled: boolean) => void;
  enablePresets?: boolean;
  enableAdvancedFeatures?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Введите текст сообщения...",
  enableMarkdown = false,
  onMarkdownToggle,
  enablePresets = true,
  enableAdvancedFeatures = true
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<{name: string, content: string}[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Update counts when value changes
  useEffect(() => {
    setWordCount(value.trim().split(/\s+/).filter(word => word.length > 0).length);
    setCharCount(value.length);
  }, [value]);

  // Save to undo stack
  const saveToUndoStack = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), value]);
    setRedoStack([]);
  }, [value]);

  // Функция для рендеринга живого предпросмотра с реальными эффектами
  const renderLivePreview = (text: string) => {
    let processedText = text;
    
    if (enableMarkdown) {
      // Обработка Markdown форматирования
      processedText = processedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Жирный
        .replace(/_(.*?)_/g, '<em>$1</em>') // Курсив
        .replace(/__(.*?)__/g, '<u>$1</u>') // Подчеркнутый
        .replace(/~(.*?)~/g, '<s>$1</s>') // Зачеркнутый
        .replace(/`(.*?)`/g, '<code class="live-preview-code">$1</code>') // Код
        .replace(/```\n(.*?)\n```/gs, '<pre class="live-preview-pre"><code>$1</code></pre>') // Блок кода
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="live-preview-link">$1</a>') // Ссылка
        .replace(/^> (.*)$/gm, '<blockquote class="live-preview-quote">$1</blockquote>') // Цитата
        .replace(/^# (.*)$/gm, '<h3 class="live-preview-heading">$1</h3>'); // Заголовок
    } else {
      // Обработка HTML форматирования
      processedText = processedText
        .replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
        .replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
        .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
        .replace(/<s>(.*?)<\/s>/g, '<s>$1</s>')
        .replace(/<code>(.*?)<\/code>/g, '<code class="live-preview-code">$1</code>')
        .replace(/<pre><code>(.*?)<\/code><\/pre>/gs, '<pre class="live-preview-pre"><code>$1</code></pre>')
        .replace(/<a href="([^"]+)">(.*?)<\/a>/g, '<a href="$1" class="live-preview-link">$2</a>')
        .replace(/<blockquote>(.*?)<\/blockquote>/g, '<blockquote class="live-preview-quote">$1</blockquote>')
        .replace(/<h3>(.*?)<\/h3>/g, '<h3 class="live-preview-heading">$1</h3>');
    }
    
    return processedText;
  };

  const formatOptions = [
    { 
      icon: Bold, 
      name: 'Жирный', 
      markdown: '**текст**', 
      html: '<b>текст</b>',
      description: 'Выделяет текст жирным шрифтом',
      shortcut: 'Ctrl+B',
      category: 'basic'
    },
    { 
      icon: Italic, 
      name: 'Курсив', 
      markdown: '_текст_', 
      html: '<i>текст</i>',
      description: 'Выделяет текст курсивом',
      shortcut: 'Ctrl+I',
      category: 'basic'
    },
    { 
      icon: Underline, 
      name: 'Подчеркнутый', 
      markdown: '__текст__', 
      html: '<u>текст</u>',
      description: 'Подчеркивает текст',
      shortcut: 'Ctrl+U',
      category: 'basic'
    },
    { 
      icon: Strikethrough, 
      name: 'Зачеркнутый', 
      markdown: '~текст~', 
      html: '<s>текст</s>',
      description: 'Зачеркивает текст',
      shortcut: 'Ctrl+Shift+X',
      category: 'basic'
    },
    { 
      icon: Code, 
      name: 'Код', 
      markdown: '`код`', 
      html: '<code>код</code>',
      description: 'Выделяет код моноширинным шрифтом',
      shortcut: 'Ctrl+E',
      category: 'basic'
    },
    { 
      icon: Link, 
      name: 'Ссылка', 
      markdown: '[текст](url)', 
      html: '<a href="url">текст</a>',
      description: 'Создает кликабельную ссылку',
      shortcut: 'Ctrl+K',
      category: 'basic'
    },
    { 
      icon: Code2, 
      name: 'Блок кода', 
      markdown: '```\nкод\n```', 
      html: '<pre><code>код</code></pre>',
      description: 'Создает блок кода',
      shortcut: 'Ctrl+Shift+C',
      category: 'advanced'
    },
    { 
      icon: Quote, 
      name: 'Цитата', 
      markdown: '> цитата', 
      html: '<blockquote>цитата</blockquote>',
      description: 'Создает блок цитаты',
      shortcut: 'Ctrl+Shift+Q',
      category: 'advanced'
    },
    { 
      icon: List, 
      name: 'Список', 
      markdown: '• пункт\n• пункт\n• пункт', 
      html: '<ul><li>пункт</li><li>пункт</li><li>пункт</li></ul>',
      description: 'Создает маркированный список',
      shortcut: 'Ctrl+Shift+L',
      category: 'advanced'
    },
    { 
      icon: ListOrdered, 
      name: 'Нумерованный список', 
      markdown: '1. пункт\n2. пункт\n3. пункт', 
      html: '<ol><li>пункт</li><li>пункт</li><li>пункт</li></ol>',
      description: 'Создает нумерованный список',
      shortcut: 'Ctrl+Shift+O',
      category: 'advanced'
    },
    { 
      icon: Hash, 
      name: 'Заголовок', 
      markdown: '# Заголовок', 
      html: '<h3>Заголовок</h3>',
      description: 'Создает заголовок',
      shortcut: 'Ctrl+H',
      category: 'advanced'
    }
  ];

  const messagePresets = [
    {
      name: 'Приветствие',
      icon: Smile,
      content: '👋 Добро пожаловать!\n\nРады видеть вас в нашем боте. Как дела?'
    },
    {
      name: 'Благодарность',
      icon: Heart,
      content: '❤️ Спасибо за обращение!\n\nВаше сообщение важно для нас.'
    },
    {
      name: 'Контакты',
      icon: Phone,
      content: '📞 **Наши контакты:**\n\n• Телефон: +7 (999) 123-45-67\n• Email: support@example.com\n• Сайт: https://example.com'
    },
    {
      name: 'Меню',
      icon: List,
      content: '📋 **Главное меню:**\n\n1. Каталог товаров\n2. Мои заказы\n3. Поддержка\n4. О компании'
    },
    {
      name: 'Инструкция',
      icon: CheckSquare,
      content: '📝 **Пошаговая инструкция:**\n\n✅ Шаг 1: Выберите категорию\n✅ Шаг 2: Укажите параметры\n✅ Шаг 3: Подтвердите заказ'
    },
    {
      name: 'Предупреждение',
      icon: AlertTriangle,
      content: '⚠️ **Внимание!**\n\nВажная информация, которую необходимо учесть.'
    }
  ];

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousValue = undoStack[undoStack.length - 1];
      setRedoStack(prev => [value, ...prev.slice(0, 19)]);
      setUndoStack(prev => prev.slice(0, -1));
      onChange(previousValue);
      toast({
        title: "Отменено",
        description: "Последнее действие отменено"
      });
    }
  }, [undoStack, value, onChange, toast]);

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextValue = redoStack[0];
      setUndoStack(prev => [...prev.slice(-19), value]);
      setRedoStack(prev => prev.slice(1));
      onChange(nextValue);
      toast({
        title: "Повторено",
        description: "Действие восстановлено"
      });
    }
  }, [redoStack, value, onChange, toast]);

  // Template management
  const saveTemplate = useCallback(() => {
    const name = prompt('Введите название шаблона:');
    if (name && value.trim()) {
      setSavedTemplates(prev => [...prev, { name, content: value }]);
      toast({
        title: "Шаблон сохранен",
        description: `Шаблон "${name}" добавлен в библиотеку`
      });
    }
  }, [value, toast]);

  const loadTemplate = useCallback((template: { name: string, content: string }) => {
    saveToUndoStack();
    onChange(template.content);
    toast({
      title: "Шаблон загружен",
      description: `Загружен шаблон "${template.name}"`
    });
  }, [onChange, saveToUndoStack, toast]);

  // Insert preset message
  const insertPreset = (preset: typeof messagePresets[0]) => {
    saveToUndoStack();
    const newContent = value ? value + '\n\n' + preset.content : preset.content;
    onChange(newContent);
    toast({
      title: "Шаблон добавлен",
      description: `Добавлен шаблон "${preset.name}"`
    });
  };

  // Keyboard shortcuts - work like in Telegram (no selection required)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const format = formatOptions.find(f => {
          const shortcut = f.shortcut?.toLowerCase();
          if (!shortcut) return false;
          
          if (shortcut.includes('shift') && !e.shiftKey) return false;
          if (!shortcut.includes('shift') && e.shiftKey) return false;
          
          const key = shortcut.split('+').pop();
          return e.key.toLowerCase() === key;
        });
        
        if (format) {
          e.preventDefault();
          insertFormatting(format);
        } else if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => textarea.removeEventListener('keydown', handleKeyDown);
    }
  }, [formatOptions, undo, redo, toast]);

  const insertFormatting = (format: typeof formatOptions[0]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    saveToUndoStack();
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const hasSelection = start !== end;
    
    let formatPrefix = '';
    let formatSuffix = '';
    let cursorOffset = 0;
    
    // Определяем символы форматирования в зависимости от режима
    if (enableMarkdown) {
      switch (format.name) {
        case 'Жирный':
          formatPrefix = '**';
          formatSuffix = '**';
          break;
        case 'Курсив':
          formatPrefix = '_';
          formatSuffix = '_';
          break;
        case 'Подчеркнутый':
          formatPrefix = '__';
          formatSuffix = '__';
          break;
        case 'Зачеркнутый':
          formatPrefix = '~';
          formatSuffix = '~';
          break;
        case 'Код':
          formatPrefix = '`';
          formatSuffix = '`';
          break;
        case 'Блок кода':
          formatPrefix = '```\n';
          formatSuffix = '\n```';
          break;
        case 'Ссылка':
          if (hasSelection) {
            const url = prompt('Введите URL:') || 'https://example.com';
            formatPrefix = '[';
            formatSuffix = `](${url})`;
          } else {
            formatPrefix = '[';
            formatSuffix = '](https://example.com)';
            cursorOffset = 1; // Поставить курсор после '['
          }
          break;
        case 'Цитата':
          formatPrefix = '> ';
          formatSuffix = '';
          break;
        case 'Заголовок':
          formatPrefix = '# ';
          formatSuffix = '';
          break;
        default:
          return;
      }
    } else {
      switch (format.name) {
        case 'Жирный':
          formatPrefix = '<b>';
          formatSuffix = '</b>';
          break;
        case 'Курсив':
          formatPrefix = '<i>';
          formatSuffix = '</i>';
          break;
        case 'Подчеркнутый':
          formatPrefix = '<u>';
          formatSuffix = '</u>';
          break;
        case 'Зачеркнутый':
          formatPrefix = '<s>';
          formatSuffix = '</s>';
          break;
        case 'Код':
          formatPrefix = '<code>';
          formatSuffix = '</code>';
          break;
        case 'Блок кода':
          formatPrefix = '<pre><code>';
          formatSuffix = '</code></pre>';
          break;
        case 'Ссылка':
          if (hasSelection) {
            const url = prompt('Введите URL:') || 'https://example.com';
            formatPrefix = `<a href="${url}">`;
            formatSuffix = '</a>';
          } else {
            formatPrefix = '<a href="https://example.com">';
            formatSuffix = '</a>';
            cursorOffset = formatPrefix.length; // Поставить курсор после открывающего тега
          }
          break;
        case 'Цитата':
          formatPrefix = '<blockquote>';
          formatSuffix = '</blockquote>';
          break;
        case 'Заголовок':
          formatPrefix = '<h3>';
          formatSuffix = '</h3>';
          break;
        default:
          return;
      }
    }
    
    let newText = '';
    let newCursorPosition = start;
    let isToggleOff = false;
    
    if (hasSelection) {
      // Проверяем, уже ли применено форматирование к выделенному тексту
      const beforeSelection = value.substring(Math.max(0, start - formatPrefix.length), start);
      const afterSelection = value.substring(end, Math.min(value.length, end + formatSuffix.length));
      
      // Для цитат и заголовков проверяем только начало строки
      if (format.name === 'Цитата' || format.name === 'Заголовок') {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const linePrefix = value.substring(lineStart, start);
        
        if (linePrefix === formatPrefix) {
          // Убираем форматирование
          newText = selectedText;
          newCursorPosition = start - formatPrefix.length;
          isToggleOff = true;
          
          // Обновляем весь текст, убирая префикс
          const newValue = value.substring(0, lineStart) + value.substring(start) + value.substring(end);
          onChange(newValue);
        } else {
          // Добавляем форматирование
          newText = formatPrefix + selectedText;
          newCursorPosition = start + newText.length;
          
          const newValue = value.substring(0, lineStart) + formatPrefix + value.substring(lineStart);
          onChange(newValue);
        }
      } else {
        // Для обычного форматирования проверяем окружение
        if (beforeSelection === formatPrefix && afterSelection === formatSuffix) {
          // Убираем форматирование
          newText = selectedText;
          newCursorPosition = start - formatPrefix.length;
          isToggleOff = true;
          
          const newValue = value.substring(0, start - formatPrefix.length) + selectedText + value.substring(end + formatSuffix.length);
          onChange(newValue);
        } else {
          // Добавляем форматирование
          newText = formatPrefix + selectedText + formatSuffix;
          newCursorPosition = start + newText.length;
          
          const newValue = value.substring(0, start) + newText + value.substring(end);
          onChange(newValue);
        }
      }
    } else {
      // Если текст не выделен - вставляем символы форматирования как в Telegram
      newText = formatPrefix + formatSuffix;
      newCursorPosition = start + formatPrefix.length + cursorOffset;
      
      const newValue = value.substring(0, start) + newText + value.substring(end);
      onChange(newValue);
    }
    
    // Устанавливаем курсор в правильную позицию
    setTimeout(() => {
      if (hasSelection && !isToggleOff) {
        // Если добавляем форматирование, выделяем отформатированный текст
        if (format.name === 'Цитата' || format.name === 'Заголовок') {
          textarea.setSelectionRange(newCursorPosition - selectedText.length, newCursorPosition);
        } else {
          textarea.setSelectionRange(start + formatPrefix.length, start + formatPrefix.length + selectedText.length);
        }
      } else {
        // Обычное позиционирование курсора
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }
      textarea.focus();
    }, 0);

    toast({
      title: isToggleOff ? "Форматирование отменено" : "Форматирование применено",
      description: hasSelection 
        ? (isToggleOff ? `Убрано форматирование "${format.name}" с выделенного текста` : `Применено к выделенному тексту: ${format.name}`)
        : `Добавлены символы: ${format.name}`,
      variant: "default"
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано!",
        description: "Форматирование скопировано в буфер обмена"
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderPreview = () => {
    if (!enableMarkdown) {
      // For HTML mode, just show the raw text with HTML tags
      return (
        <div className="p-3 bg-muted/50 rounded-lg border min-h-[100px] whitespace-pre-wrap">
          <div className="text-sm text-muted-foreground mb-2">HTML предпросмотр:</div>
          <div dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      );
    }
    
    // For Markdown mode, convert common markdown to HTML for preview
    let htmlContent = value
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/~(.*?)~/g, '<s>$1</s>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br>');
    
    return (
      <div className="p-3 bg-muted/50 rounded-lg border min-h-[100px]">
        <div className="text-sm text-muted-foreground mb-2">Предпросмотр:</div>
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    );
  };

  // Filter formats based on search
  const filteredFormats = formatOptions.filter(format => 
    searchTerm === '' || format.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const basicFormats = filteredFormats.filter(f => f.category === 'basic');
  const advancedFormats = filteredFormats.filter(f => f.category === 'advanced');

  return (
    <Card className={`w-full transition-all duration-300 ${isExpanded ? 'col-span-2' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            Продвинутый редактор форматирования
            {charCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {wordCount} слов • {charCount} символов
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
              title={isExpanded ? "Свернуть" : "Развернуть"}
            >
              {isExpanded ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkdownToggle?.(!enableMarkdown)}
              className="text-xs"
            >
              {enableMarkdown ? 'Markdown' : 'HTML'}
            </Button>
          </div>
        </div>

        {/* Enhanced toolbar with undo/redo and actions */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={undoStack.length === 0}
              className="h-8 w-8 p-0"
              title="Отменить (Ctrl+Z)"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={redoStack.length === 0}
              className="h-8 w-8 p-0"
              title="Повторить (Ctrl+Y)"
            >
              <RotateCw className="w-3 h-3" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={saveTemplate}
            disabled={!value.trim()}
            className="h-8 px-2 text-xs"
            title="Сохранить как шаблон"
          >
            <Save className="w-3 h-3 mr-1" />
            Сохранить
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(value)}
            disabled={!value.trim()}
            className="h-8 px-2 text-xs"
            title="Копировать весь текст"
          >
            <Copy className="w-3 h-3 mr-1" />
            Копировать
          </Button>

          {enableAdvancedFeatures && (
            <div className="flex items-center gap-1 ml-auto">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск..."
                className="h-8 w-24 text-xs"
              />
              <Search className="w-3 h-3 text-muted-foreground -ml-6" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Message Presets */}
        {enablePresets && (
          <div className="space-y-3">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Готовые шаблоны сообщений
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {messagePresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => insertPreset(preset)}
                  className="justify-start gap-2 h-9 text-xs"
                  title={preset.content.slice(0, 50) + '...'}
                >
                  <preset.icon className="w-3 h-3 text-blue-500" />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Basic Formatting Toolbar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Type className="w-3 h-3" />
              Базовое форматирование
            </Label>
            <Badge variant="secondary" className="text-xs">
              📝 Выделите → Нажмите кнопку
            </Badge>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 mb-3">
            <div className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span>💡</span>
              <span>Как в Telegram: сначала выделите текст, затем выберите форматирование</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {basicFormats.map((format) => (
              <Button
                key={format.name}
                variant="outline"
                size="sm"
                onClick={() => insertFormatting(format)}
                className="justify-start gap-2 h-8 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/50"
                title={`Выделите текст и нажмите для применения (${format.shortcut})`}
              >
                <format.icon className="w-3 h-3" />
                {format.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Formatting */}
        {enableAdvancedFeatures && advancedFormats.length > 0 && (
          <div className="space-y-3">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Settings className="w-3 h-3" />
              Продвинутое форматирование
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {advancedFormats.map((format) => (
                <Button
                  key={format.name}
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting(format)}
                  className="justify-start gap-2 h-8 text-xs"
                  title={`${format.description} (${format.shortcut})`}
                >
                  <format.icon className="w-3 h-3" />
                  {format.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Saved Templates */}
        {savedTemplates.length > 0 && (
          <div className="space-y-3">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Star className="w-3 h-3" />
              Сохраненные шаблоны
            </Label>
            <ScrollArea className="h-20">
              <div className="space-y-1">
                {savedTemplates.map((template, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadTemplate(template)}
                      className="flex-1 justify-start text-xs h-7"
                    >
                      {template.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSavedTemplates(prev => prev.filter((_, i) => i !== index))}
                      className="h-7 w-7 p-0 text-red-500"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Separator />

        {/* Enhanced Text Editor with Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Type className="w-3 h-3" />
              Редактор {charCount > 0 && <Badge variant="outline" className="text-xs">{charCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-3 h-3" />
              Предпросмотр
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Редактор */}
              <div className="relative">
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Редактор кода
                </Label>
                <Textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => {
                    saveToUndoStack();
                    onChange(e.target.value);
                  }}
                  placeholder="Введите текст сообщения..."
                  className={`min-h-[120px] resize-none transition-all duration-200 font-mono text-sm ${
                    isExpanded ? 'min-h-[200px]' : ''
                  }`}
                  rows={isExpanded ? 10 : 6}
                  onSelect={(e) => {
                    // Показываем интерактивную подсказку при выделении как в Telegram
                    const textarea = e.target as HTMLTextAreaElement;
                    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
                      const selectedText = value.substring(textarea.selectionStart, textarea.selectionEnd);
                      if (selectedText.length > 0 && selectedText.length <= 200) {
                        // Debounce для избежания спама уведомлений
                        setTimeout(() => {
                          if (textarea.selectionStart !== textarea.selectionEnd) {
                            const currentSelection = value.substring(textarea.selectionStart, textarea.selectionEnd);
                            if (currentSelection === selectedText) {
                              toast({
                                title: `✅ Выделено: "${selectedText.slice(0, 20)}${selectedText.length > 20 ? '...' : ''}"`,
                                description: "Теперь нажмите B/I/U или выберите форматирование из панели выше",
                                duration: 3000
                              });
                            }
                          }
                        }, 500);
                      }
                    }
                  }}
                />
                
                {/* Character count overlay */}
                {charCount > 0 && (
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    {charCount}/4096
                  </div>
                )}
                
                {/* Selection helper overlay - показываем только если нет текста */}
                {!value && (
                  <div className="absolute top-2 right-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded opacity-70">
                    💡 Выделите текст для форматирования
                  </div>
                )}
              </div>

              {/* Живой предпросмотр */}
              <div className="relative">
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Живой предпросмотр
                </Label>
                <div className={`border rounded-md p-3 bg-background min-h-[120px] ${
                  isExpanded ? 'min-h-[200px]' : ''
                } overflow-auto`}>
                  {value ? (
                    <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{
                      __html: renderLivePreview(value)
                    }} />
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      Предпросмотр появится здесь...
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  {enableMarkdown ? '📝 Markdown' : '🏷️ HTML'} форматирование
                </span>
                <span>📊 {wordCount} слов, {charCount} символов</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⌨️ Выделение + Ctrl+B/I/U</span>
              </div>
            </div>
            
            {/* Usage instructions */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <div className="text-xs space-y-1">
                <div className="font-medium text-green-700 dark:text-green-300 mb-2">🎯 Как использовать форматирование:</div>
                <div className="space-y-1 text-green-600 dark:text-green-400">
                  <div>1️⃣ Напишите или вставьте текст</div>
                  <div>2️⃣ Выделите часть текста мышкой</div>
                  <div>3️⃣ Нажмите нужную кнопку форматирования</div>
                  <div className="text-blue-600 dark:text-blue-400 mt-2">⚡ Быстро: Ctrl+B (жирный), Ctrl+I (курсив), Ctrl+U (подчеркнутый)</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-medium">Предпросмотр как в Telegram</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {enableMarkdown ? 'Markdown' : 'HTML'}
                </Badge>
                {charCount > 4096 && (
                  <Badge variant="destructive" className="text-xs">
                    Превышен лимит
                  </Badge>
                )}
              </div>
            </div>
            {renderPreview()}
            
            {charCount > 0 && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span>📊 Статистика: {wordCount} слов, {charCount} символов</span>
                <span>📱 Совместимость: {charCount <= 4096 ? '✅' : '❌'} Telegram</span>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Enhanced Quick Reference with expandable content */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-3 space-y-2 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Zap className="w-3 h-3 text-blue-500" />
              Быстрая справка по форматированию
            </Label>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(formatOptions.map(f => 
                  `${f.name}: ${enableMarkdown ? f.markdown : f.html}`
                ).join('\n'))}
                className="h-6 px-2"
                title="Копировать все команды"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-1 text-xs">
            {(searchTerm ? filteredFormats : formatOptions).slice(0, 6).map((format) => (
              <div key={format.name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <format.icon className="w-3 h-3 text-blue-500" />
                  <span className="text-muted-foreground">{format.name}:</span>
                </div>
                <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs border">
                  {enableMarkdown ? format.markdown : format.html}
                </code>
              </div>
            ))}
          </div>
          
          {formatOptions.length > 6 && (
            <div className="text-center pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6"
                onClick={() => setSearchTerm('')}
              >
                Показать все ({formatOptions.length}) команд
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}