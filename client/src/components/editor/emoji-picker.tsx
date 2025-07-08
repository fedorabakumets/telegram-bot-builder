import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Smile, 
  Heart, 
  Star, 
  Zap, 
  Search,
  Copy,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onSymbolSelect: (symbol: string) => void;
}

interface EmojiCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  emojis: string[];
}

interface SymbolCategory {
  name: string;
  symbols: Array<{
    symbol: string;
    name: string;
    description: string;
  }>;
}

export function EmojiPicker({ onEmojiSelect, onSymbolSelect }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'emojis' | 'symbols' | 'templates'>('emojis');
  const { toast } = useToast();

  const emojiCategories: EmojiCategory[] = [
    {
      name: 'Эмоции',
      icon: Smile,
      emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕']
    },
    {
      name: 'Жесты',
      icon: Heart,
      emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸']
    },
    {
      name: 'Объекты',
      icon: Star,
      emojis: ['⭐', '🌟', '💫', '✨', '🔥', '💥', '💢', '💦', '💨', '🌪️', '⚡', '🔔', '🔕', '💡', '🔦', '🕯️', '🪔', '🧿', '📱', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '💾', '💿', '📀', '🎥', '📷', '📹', '📼', '🔍', '🔎', '🕯️', '💰', '💎', '⚖️', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧰', '🧲', '🔫', '💣', '🧨', '🔪', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧽', '🚽', '🚰', '🚿', '🛁', '🛀', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒']
    },
    {
      name: 'Природа',
      icon: Zap,
      emojis: ['🌱', '🌿', '🍀', '🌾', '🌵', '🌴', '🌳', '🌲', '🌰', '🌯', '🌻', '🌺', '🌸', '🌼', '🌷', '🥀', '🌹', '🌚', '🌛', '🌜', '🌝', '🌞', '🌟', '⭐', '🌠', '⚡', '⛅', '⛈️', '🌤️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔', '☂️', '🌊', '🌍', '🌎', '🌏', '🪐', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔']
    }
  ];

  const symbolCategories: SymbolCategory[] = [
    {
      name: 'Стрелки',
      symbols: [
        { symbol: '→', name: 'Стрелка вправо', description: 'Для указания направления' },
        { symbol: '←', name: 'Стрелка влево', description: 'Для указания направления' },
        { symbol: '↑', name: 'Стрелка вверх', description: 'Для указания направления' },
        { symbol: '↓', name: 'Стрелка вниз', description: 'Для указания направления' },
        { symbol: '↗', name: 'Стрелка вправо-вверх', description: 'Диагональная стрелка' },
        { symbol: '↘', name: 'Стрелка вправо-вниз', description: 'Диагональная стрелка' },
        { symbol: '↙', name: 'Стрелка влево-вниз', description: 'Диагональная стрелка' },
        { symbol: '↖', name: 'Стрелка влево-вверх', description: 'Диагональная стрелка' },
        { symbol: '⇒', name: 'Двойная стрелка вправо', description: 'Жирная стрелка' },
        { symbol: '⇐', name: 'Двойная стрелка влево', description: 'Жирная стрелка' },
        { symbol: '⇑', name: 'Двойная стрелка вверх', description: 'Жирная стрелка' },
        { symbol: '⇓', name: 'Двойная стрелка вниз', description: 'Жирная стрелка' }
      ]
    },
    {
      name: 'Математические',
      symbols: [
        { symbol: '±', name: 'Плюс-минус', description: 'Математический символ' },
        { symbol: '×', name: 'Умножение', description: 'Знак умножения' },
        { symbol: '÷', name: 'Деление', description: 'Знак деления' },
        { symbol: '=', name: 'Равно', description: 'Знак равенства' },
        { symbol: '≠', name: 'Не равно', description: 'Знак неравенства' },
        { symbol: '≤', name: 'Меньше или равно', description: 'Математическое сравнение' },
        { symbol: '≥', name: 'Больше или равно', description: 'Математическое сравнение' },
        { symbol: '∞', name: 'Бесконечность', description: 'Символ бесконечности' },
        { symbol: '√', name: 'Квадратный корень', description: 'Математический корень' },
        { symbol: '²', name: 'Степень 2', description: 'Надстрочный индекс' },
        { symbol: '³', name: 'Степень 3', description: 'Надстрочный индекс' },
        { symbol: '%', name: 'Процент', description: 'Знак процента' }
      ]
    },
    {
      name: 'Пунктуация',
      symbols: [
        { symbol: '•', name: 'Маркер списка', description: 'Для создания списков' },
        { symbol: '◦', name: 'Белый маркер', description: 'Для вложенных списков' },
        { symbol: '▪', name: 'Черный квадратик', description: 'Альтернативный маркер' },
        { symbol: '▫', name: 'Белый квадратик', description: 'Альтернативный маркер' },
        { symbol: '—', name: 'Длинное тире', description: 'Пунктуационный знак' },
        { symbol: '–', name: 'Короткое тире', description: 'Пунктуационный знак' },
        { symbol: '…', name: 'Многоточие', description: 'Три точки' },
        { symbol: '«', name: 'Левая кавычка', description: 'Открывающая кавычка' },
        { symbol: '»', name: 'Правая кавычка', description: 'Закрывающая кавычка' },
        { symbol: '"', name: 'Левая двойная кавычка', description: 'Открывающая кавычка' },
        { symbol: '"', name: 'Правая двойная кавычка', description: 'Закрывающая кавычка' },
        { symbol: '§', name: 'Параграф', description: 'Знак параграфа' }
      ]
    },
    {
      name: 'Специальные',
      symbols: [
        { symbol: '☑', name: 'Галочка в квадрате', description: 'Выполненная задача' },
        { symbol: '☐', name: 'Пустой квадрат', description: 'Невыполненная задача' },
        { symbol: '✓', name: 'Галочка', description: 'Знак выполнения' },
        { symbol: '✗', name: 'Крестик', description: 'Знак отмены' },
        { symbol: '⚠', name: 'Предупреждение', description: 'Знак внимания' },
        { symbol: '⚡', name: 'Молния', description: 'Быстрота, энергия' },
        { symbol: '♨', name: 'Горячие источники', description: 'Символ температуры' },
        { symbol: '♻', name: 'Переработка', description: 'Экологический символ' },
        { symbol: '©', name: 'Копирайт', description: 'Авторское право' },
        { symbol: '®', name: 'Зарегистрированный товарный знак', description: 'Торговая марка' },
        { symbol: '™', name: 'Товарный знак', description: 'Торговая марка' },
        { symbol: '№', name: 'Номер', description: 'Знак номера' }
      ]
    }
  ];

  const textTemplates = [
    {
      name: 'Приветствие',
      template: '👋 Добро пожаловать!\n\n🎉 Мы рады видеть вас здесь!'
    },
    {
      name: 'Список задач',
      template: '📋 **Список задач:**\n\n☐ Задача 1\n☐ Задача 2\n☑ Выполненная задача'
    },
    {
      name: 'Предупреждение',
      template: '⚠️ **Внимание!**\n\n🚨 Важная информация для пользователей'
    },
    {
      name: 'Успех',
      template: '✅ **Успешно!**\n\n🎊 Операция выполнена успешно'
    },
    {
      name: 'Контакты',
      template: '📞 **Контакты:**\n\n📧 Email: example@email.com\n📱 Телефон: +7 (999) 123-45-67'
    },
    {
      name: 'Меню',
      template: '🍽️ **Меню:**\n\n• Пункт 1\n• Пункт 2\n• Пункт 3'
    }
  ];

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    toast({
      title: "Эмодзи добавлен",
      description: `${emoji} добавлен в текст`
    });
  };

  const handleSymbolClick = (symbol: string) => {
    onSymbolSelect(symbol);
    toast({
      title: "Символ добавлен",
      description: `${symbol} добавлен в текст`
    });
  };

  const copyTemplate = async (template: string) => {
    try {
      await navigator.clipboard.writeText(template);
      toast({
        title: "Шаблон скопирован",
        description: "Шаблон скопирован в буфер обмена"
      });
    } catch (err) {
      console.error('Failed to copy template: ', err);
    }
  };

  const filteredEmojis = emojiCategories.map(category => ({
    ...category,
    emojis: category.emojis.filter(emoji => 
      !searchTerm || emoji.includes(searchTerm)
    )
  }));

  const filteredSymbols = symbolCategories.map(category => ({
    ...category,
    symbols: category.symbols.filter(item => 
      !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.symbol.includes(searchTerm)
    )
  }));

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Эмодзи и символы
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск эмодзи или символов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="emojis">Эмодзи</TabsTrigger>
            <TabsTrigger value="symbols">Символы</TabsTrigger>
            <TabsTrigger value="templates">Шаблоны</TabsTrigger>
          </TabsList>

          <TabsContent value="emojis" className="space-y-4">
            <ScrollArea className="h-64 pr-4">
              {filteredEmojis.map((category) => (
                <div key={category.name} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <category.icon className="w-4 h-4" />
                    <Label className="text-xs font-medium">{category.name}</Label>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {category.emojis.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEmojiClick(emoji)}
                        className="h-8 w-8 p-0 hover:bg-muted"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="symbols" className="space-y-4">
            <ScrollArea className="h-64 pr-4">
              {filteredSymbols.map((category) => (
                <div key={category.name} className="mb-4">
                  <Label className="text-xs font-medium mb-2 block">{category.name}</Label>
                  <div className="grid grid-cols-1 gap-1">
                    {category.symbols.map((item, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSymbolClick(item.symbol)}
                        className="justify-start h-8 px-2 gap-3"
                      >
                        <span className="text-base">{item.symbol}</span>
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <ScrollArea className="h-64 pr-4">
              <div className="space-y-2">
                {textTemplates.map((template, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {template.name}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEmojiSelect(template.template)}
                          className="h-6 px-2 text-xs"
                        >
                          Вставить
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTemplate(template.template)}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {template.template}
                    </pre>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}