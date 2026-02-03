import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Link, 
  List,
  ListOrdered,
  Quote,
  Smile,
  Zap,
  Star,
  CheckSquare,
  AlertTriangle,
  Heart,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Settings,
  Sparkles,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickFormatToolbarProps {
  onInsert: (text: string) => void;
  isMarkdown?: boolean;
}

export function QuickFormatToolbar({ onInsert, isMarkdown = false }: QuickFormatToolbarProps) {
  const { toast } = useToast();

  const formatButtons = [
    { 
      icon: Bold, 
      name: 'Жирный', 
      markdown: '**текст**', 
      html: '<b>текст</b>',
      shortcut: 'Ctrl+B'
    },
    { 
      icon: Italic, 
      name: 'Курсив', 
      markdown: '_текст_', 
      html: '<i>текст</i>',
      shortcut: 'Ctrl+I'
    },
    { 
      icon: Underline, 
      name: 'Подчеркнутый', 
      markdown: '__текст__', 
      html: '<u>текст</u>',
      shortcut: 'Ctrl+U'
    },
    { 
      icon: Strikethrough, 
      name: 'Зачеркнутый', 
      markdown: '~текст~', 
      html: '<s>текст</s>',
      shortcut: 'Ctrl+Shift+X'
    },
    { 
      icon: Code, 
      name: 'Код', 
      markdown: '`код`', 
      html: '<code>код</code>',
      shortcut: 'Ctrl+E'
    },
    { 
      icon: Link, 
      name: 'Ссылка', 
      markdown: '[текст](url)', 
      html: '<a href="url">текст</a>',
      shortcut: 'Ctrl+K'
    }
  ];

  const quickEmojis = [
    { emoji: '👍', name: 'Лайк' },
    { emoji: '❤️', name: 'Сердце' },
    { emoji: '🔥', name: 'Огонь' },
    { emoji: '⭐', name: 'Звезда' },
    { emoji: '✅', name: 'Галочка' },
    { emoji: '⚠️', name: 'Внимание' },
    { emoji: '📞', name: 'Телефон' },
    { emoji: '📧', name: 'Email' },
    { emoji: '📍', name: 'Локация' },
    { emoji: '⏰', name: 'Время' },
    { emoji: '🚀', name: 'Ракета' },
    { emoji: '💡', name: 'Идея' }
  ];

  const quickSymbols = [
    { symbol: '•', name: 'Маркер' },
    { symbol: '→', name: 'Стрелка' },
    { symbol: '✓', name: 'Галочка' },
    { symbol: '✗', name: 'Крестик' },
    { symbol: '—', name: 'Тире' },
    { symbol: '…', name: 'Многоточие' },
    { symbol: '«»', name: 'Кавычки' },
    { symbol: '№', name: 'Номер' },
    { symbol: '©', name: 'Копирайт' },
    { symbol: '®', name: 'Товарный знак' },
    { symbol: '™', name: 'Торговая марка' },
    { symbol: '§', name: 'Параграф' }
  ];

  const quickTemplates = [
    {
      name: 'Список',
      icon: List,
      template: isMarkdown ? '• Пункт 1\n• Пункт 2\n• Пункт 3' : '• Пункт 1<br>• Пункт 2<br>• Пункт 3'
    },
    {
      name: 'Нумерованный список',
      icon: ListOrdered,
      template: isMarkdown ? '1. Пункт 1\n2. Пункт 2\n3. Пункт 3' : '1. Пункт 1<br>2. Пункт 2<br>3. Пункт 3'
    },
    {
      name: 'Цитата',
      icon: Quote,
      template: isMarkdown ? '> Это цитата' : '<blockquote>Это цитата</blockquote>'
    },
    {
      name: 'Задачи',
      icon: CheckSquare,
      template: '☐ Задача 1\n☐ Задача 2\n☑ Выполнено'
    },
    {
      name: 'Предупреждение',
      icon: AlertTriangle,
      template: '⚠️ **Внимание!**\nВажная информация'
    },
    {
      name: 'Контакты',
      icon: Phone,
      template: '📞 Телефон: +7 (999) 123-45-67\n📧 Email: example@email.com'
    }
  ];

  const handleInsert = (text: string, name: string) => {
    onInsert(text);
    toast({
      title: "Добавлено",
      description: `${name} добавлен в текст`
    });
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
      {/* Format buttons */}
      <div className="flex gap-1">
        {formatButtons.map((format) => (
          <Button
            key={format.name}
            variant="ghost"
            size="sm"
            onClick={() => handleInsert(isMarkdown ? format.markdown : format.html, format.name)}
            className="h-8 w-8 p-0"
            title={`${format.name} (${format.shortcut})`}
          >
            <format.icon className="w-3 h-3" />
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Quick emojis */}
      <div className="flex gap-1">
        {quickEmojis.slice(0, 6).map((item) => (
          <Button
            key={item.emoji}
            variant="ghost"
            size="sm"
            onClick={() => handleInsert(item.emoji, item.name)}
            className="h-8 w-8 p-0"
            title={item.name}
          >
            {item.emoji}
          </Button>
        ))}
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Больше эмодзи">
              <Plus className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="grid grid-cols-6 gap-1">
              {quickEmojis.map((item) => (
                <Button
                  key={item.emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInsert(item.emoji, item.name)}
                  className="h-8 w-8 p-0"
                  title={item.name}
                >
                  {item.emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Quick symbols */}
      <div className="flex gap-1">
        {quickSymbols.slice(0, 4).map((item) => (
          <Button
            key={item.symbol}
            variant="ghost"
            size="sm"
            onClick={() => handleInsert(item.symbol, item.name)}
            className="h-8 w-8 p-0 text-xs"
            title={item.name}
          >
            {item.symbol}
          </Button>
        ))}
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Больше символов">
              <Sparkles className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="grid grid-cols-4 gap-1">
              {quickSymbols.map((item) => (
                <Button
                  key={item.symbol}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInsert(item.symbol, item.name)}
                  className="h-8 justify-start text-xs"
                  title={item.name}
                >
                  {item.symbol}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Quick templates */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" title="Шаблоны">
            <Settings className="w-3 h-3 mr-1" />
            Шаблоны
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-1">
            {quickTemplates.map((template) => (
              <Button
                key={template.name}
                variant="ghost"
                size="sm"
                onClick={() => handleInsert(template.template, template.name)}
                className="w-full justify-start h-8 text-xs"
              >
                <template.icon className="w-3 h-3 mr-2" />
                {template.name}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Format mode indicator */}
      <div className="ml-auto flex items-center">
        <Badge variant="outline" className="text-xs">
          {isMarkdown ? 'Markdown' : 'HTML'}
        </Badge>
      </div>
    </div>
  );
}