/**
 * @fileoverview Компонент предварительного просмотра бота
 *
 * Этот компонент предоставляет интерфейс для предварительного просмотра
 * телеграм-бота с возможностью взаимодействия с ним в режиме чата.
 *
 * @module BotPreview
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/editor/header';
import { useQuery } from '@tanstack/react-query';
import { BotProject, Node, BotData } from '@shared/schema';
import { parseCommandFromText } from '@/lib/commands';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft, Send, Phone, MessageCircle, Users, Bot } from 'lucide-react';
import { SheetsManager } from '@/utils/sheets-manager';

/**
 * Функция для рендеринга markdown в HTML
 *
 * @param {string} text - Текст с markdown разметкой
 * @returns {string} Текст с HTML разметкой
 */
const renderMarkdown = (text: string): string => {
  return text
    // Жирный текст: **text** → <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Курсив: *text* → <em>text</em>
    .replace(/\*((?:[^*]|\*{2})*?)\*/g, '<em>$1</em>')
    // Код: `text` → <code>text</code>
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs">$1</code>')
    // Переносы строк: \n → <br>
    .replace(/\n/g, '<br>')
    // Ссылки: [text](url) → <a href="url">text</a>
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
};

/**
 * Компонент предварительного просмотра бота
 *
 * @returns {JSX.Element} Компонент предварительного просмотра бота
 */
export default function BotPreview() {
  /**
   * Функция навигации для перемещения между страницами
   */
  const [, setLocation] = useLocation();

  /**
   * Параметры URL
   */
  const params = useParams();

  /**
   * ID проекта из URL
   * @type {number|null}
   */
  const projectId = params.id ? parseInt(params.id) : null;

  /**
   * Запрос для загрузки данных проектов
   *
   * @type {Object}
   * @property {BotProject[]} data - Данные проектов
   */
  const { data: projects } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
  });

  /**
   * Текущий проект, соответствующий ID из URL
   * @type {BotProject|undefined}
   */
  const currentProject = projects?.find(p => p.id === projectId);

  /**
   * Извлечение узлов и соединений из данных проекта
   *
   * @function getNodesAndConnections
   * @returns {Object} Объект с узлами и соединениями
   * @returns {Node[]} return.nodes - Массив узлов
   * @returns {Connection[]} return.connections - Массив соединений
   */
  const getNodesAndConnections = useCallback(() => {
    if (!currentProject?.data) return { nodes: [], connections: [] };

    const projectData = currentProject.data as any;

    // Проверяем, является ли формат новым с листами
    if (SheetsManager.isNewFormat(projectData)) {
      const activeSheet = SheetsManager.getActiveSheet(projectData);
      if (activeSheet) {
        return { nodes: activeSheet.nodes, connections: activeSheet.connections };
      }
    } else {
      // Устаревший формат
      const botData = projectData as BotData;
      return { nodes: botData.nodes || [], connections: botData.connections || [] };
    }

    return { nodes: [], connections: [] };
  }, [currentProject?.data]);

  const { nodes, connections } = getNodesAndConnections();

  /**
   * Состояние ID текущего узла
   * @type {string}
   */
  const [currentNodeId, setCurrentNodeId] = useState<string>('');

  /**
   * История сообщений в чате
   * @type {Array<Object>}
   */
  const [messageHistory, setMessageHistory] = useState<Array<{
    id: string;
    type: 'bot' | 'user';
    text: string;
    time: string;
    buttons?: Array<{ text: string; target?: string; action?: string; }>;
    keyboardType?: 'reply' | 'inline' | 'none';
    mediaType?: 'photo' | 'video' | 'audio' | 'document' | 'sticker' | 'voice' | 'animation' | 'location' | 'contact' | 'poll' | 'dice';
    mediaUrl?: string;
    mediaCaption?: string;
    mediaData?: any;
  }>>([]);

  /**
   * Текущая клавиатура ответов
   * @type {Array<Object>|null}
   */
  const [currentReplyKeyboard, setCurrentReplyKeyboard] = useState<Array<{ text: string; target?: string; action?: string; }> | null>(null);

  /**
   * Текст ввода пользователя
   * @type {string}
   */
  const [textInput, setTextInput] = useState('');

  /**
   * Флаг ожидания ввода от пользователя
   * @type {boolean}
   */
  const [waitingForInput, setWaitingForInput] = useState(false);

  /**
   * Ссылка на элемент ввода
   */
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Ссылка на область чата
   */
  const chatAreaRef = useRef<HTMLDivElement>(null);

  /**
   * Начальный узел (стартовый или первый)
   * @type {Node|undefined}
   */
  const startNode = nodes.find(node => node.type === 'start') || nodes[0];

  /**
   * Вспомогательная функция для поиска следующего узла на основе соединений
   *
   * @function findNextNode
   * @param {string} currentNodeId - ID текущего узла
   * @param {boolean} _isSuccess - Флаг успеха (не используется)
   * @returns {Node|null} Следующий узел или null, если не найден
   */
  const findNextNode = (currentNodeId: string, _isSuccess: boolean = true) => {
    const fromConnections = connections.filter(conn => conn.source === currentNodeId);

    if (fromConnections.length === 0) {
      return null;
    }

    const nextConnection = fromConnections[0];
    return nextConnection ? nodes.find(node => node.id === nextConnection.target) : null;
  };

  /**
   * Вспомогательная функция для получения информации о медиа из узла
   *
   * @function getMediaInfo
   * @param {Node} node - Узел, из которого извлекается информация о медиа
   * @returns {Object|null} Объект с информацией о медиа или null
   */
  const getMediaInfo = (node: Node) => {
    switch (node.type) {
      case 'photo':
        return {
          mediaType: 'photo' as const,
          // Заглушка для фото - можно заменить на изображение по умолчанию
          mediaUrl: node.data.imageUrl || 'https://picsum.photos/800/600?random=1',
          mediaCaption: node.data.mediaCaption
        };
      case 'video':
        return {
          mediaType: 'video' as const,
          // Заглушка для видео - можно заменить на видео по умолчанию
          mediaUrl: node.data.videoUrl || 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          mediaCaption: node.data.mediaCaption
        };
      case 'audio':
        return {
          mediaType: 'audio' as const,
          // Заглушка для аудио - можно заменить на аудио по умолчанию
          mediaUrl: node.data.audioUrl || 'https://www.soundjay.com/misc/beep-07a.wav',
          mediaCaption: node.data.mediaCaption,
          mediaData: {
            performer: node.data.performer,
            duration: node.data.duration
          }
        };
      case 'document':
        return {
          mediaType: 'document' as const,
          // Заглушка для документа - можно заменить на документ по умолчанию
          mediaUrl: node.data.documentUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          mediaCaption: node.data.mediaCaption,
          mediaData: {
            filename: node.data.filename || node.data.documentName || 'document.pdf'
          }
        };
      case 'sticker':
        return {
          mediaType: 'sticker' as const,
          // Заглушка для стикера - можно заменить на стикер по умолчанию
          mediaUrl: node.data.stickerUrl || 'https://telegram.org/img/t_logo.png',
          mediaCaption: node.data.mediaCaption
        };
      case 'voice':
        return {
          mediaType: 'voice' as const,
          // Заглушка для голосового сообщения - можно заменить на голосовое сообщение по умолчанию
          mediaUrl: node.data.voiceUrl || 'https://www.soundjay.com/misc/beep-07a.wav',
          mediaCaption: node.data.mediaCaption,
          mediaData: {
            duration: node.data.duration
          }
        };
      case 'animation':
        return {
          mediaType: 'animation' as const,
          // Заглушка для анимации - можно заменить на анимацию по умолчанию
          mediaUrl: node.data.animationUrl || 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
          mediaCaption: node.data.mediaCaption
        };
      case 'location':
        return {
          mediaType: 'location' as const,
          mediaData: {
            latitude: node.data.latitude || 55.7558,
            longitude: node.data.longitude || 37.6176,
            title: node.data.title || 'Местоположение',
            address: node.data.address || 'Адрес не указан'
          }
        };
      case 'contact':
        return {
          mediaType: 'contact' as const,
          mediaData: {
            phoneNumber: node.data.phoneNumber || '+7 (900) 123-45-67',
            firstName: node.data.firstName || 'Имя',
            lastName: node.data.lastName || 'Фамилия'
          }
        };
      case 'keyboard':
        if (node.data.action === 'poll') {
          return {
            mediaType: 'poll' as const,
            mediaData: {
              question: node.data.question || 'Вопрос опроса',
              options: node.data.options || ['Вариант 1', 'Вариант 2'],
              isAnonymous: node.data.isAnonymous || true,
              allowsMultipleAnswers: node.data.allowsMultipleAnswers || false
            }
          };
        } else if (node.data.action === 'dice') {
          return {
            mediaType: 'dice' as const,
            mediaData: {
              emoji: node.data.emoji || '🎲'
            }
          };
        }
        break;
      default:
        return null;
    }
  };

  /**
   * Обработка узла и добавление его в чат
   *
   * @function processNode
   * @param {Node} node - Узел для обработки
   * @param {string} [userMessage] - Сообщение пользователя (опционально)
   * @returns {void}
   */
  const processNode = useCallback((node: Node, userMessage?: string) => {
    if (!node) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Добавляем сообщение пользователя, если оно предоставлено
    if (userMessage) {
      setMessageHistory(prev => [...prev, {
        id: `user-${Date.now()}`,
        type: 'user',
        text: userMessage,
        time: timeString
      }]);
    }

    // Получаем информацию о медиа для узла
    const mediaInfo = getMediaInfo(node);

    // Создаем сообщение бота
    const botMessage: any = {
      id: node.id,
      type: 'bot',
      text: node.data.text || node.data.messageText || '',
      time: timeString,
      buttons: [],
      keyboardType: 'none'
    };

    // Добавляем информацию о медиа, если она есть
    if (mediaInfo) {
      Object.assign(botMessage, mediaInfo);
    }

    // Обрабатываем различные типы узлов
    switch (node.type) {
      case 'message':
      case 'start':
        // Добавляем кнопки, если они существуют
        if (node.data.buttons && node.data.buttons.length > 0) {
          botMessage.buttons = node.data.buttons.map((btn: any) => ({
            text: btn.text,
            target: btn.target,
            action: btn.action
          }));
          botMessage.keyboardType = node.data.keyboardType || 'inline';
        }
        break;

      case 'keyboard':
        if (node.data.action === 'input') {
          setWaitingForInput(true);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
        break;

      case 'condition':
        // Для условных узлов автоматически переходим к следующему узлу
        const nextNode = findNextNode(node.id, true);
        if (nextNode) {
          setTimeout(() => processNode(nextNode), 500);
          return;
        }
        break;
    }

    // Добавляем сообщение бота в историю
    setMessageHistory(prev => [...prev, botMessage]);

    // Устанавливаем текущую клавиатуру ответов
    if (botMessage.buttons && botMessage.buttons.length > 0 && botMessage.keyboardType === 'reply') {
      setCurrentReplyKeyboard(botMessage.buttons);
    } else if (botMessage.keyboardType === 'inline' || botMessage.keyboardType === 'none') {
      setCurrentReplyKeyboard(null);
    }

    // Автоматическая прокрутка вниз
    setTimeout(() => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }, 100);

    // Проверяем автопередачу сначала
    if (node.data.enableAutoTransition && node.data.autoTransitionTo) {
      console.log(`⚡ Автопереход от ${node.id} к ${node.data.autoTransitionTo}`);
      const autoTransitionNode = nodes.find(n => n.id === node.data.autoTransitionTo);
      if (autoTransitionNode) {
        setTimeout(() => processNode(autoTransitionNode), 800);
        setCurrentNodeId(node.id);
        return;
      }
    }

    // Если это не узел ввода и не узел с кнопками, автоматически переходим к следующему
    if (!(node.type === 'keyboard' && node.data.action === 'input') && (!botMessage.buttons || botMessage.buttons.length === 0)) {
      const nextNode = findNextNode(node.id);
      if (nextNode) {
        setTimeout(() => processNode(nextNode), 1000);
      }
    }

    setCurrentNodeId(node.id);
  }, [connections, findNextNode, nodes]);

  /**
   * Обработка клика по кнопке
   *
   * @function handleButtonClick
   * @param {Object} button - Объект кнопки
   * @param {string} button.text - Текст кнопки
   * @param {string} [button.target] - Целевой узел
   * @param {string} [button.action] - Действие кнопки
   * @returns {void}
   */
  const handleButtonClick = (button: { text: string; target?: string; action?: string; }) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Добавляем сообщение пользователя
    setMessageHistory(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user',
      text: button.text,
      time: timeString
    }]);

    // Очищаем клавиатуру ответов после клика по кнопке
    setCurrentReplyKeyboard(null);

    // Находим целевой узел и обрабатываем его
    if (button.target) {
      const targetNode = nodes.find(node => node.id === button.target);
      if (targetNode) {
        setTimeout(() => processNode(targetNode), 500);
      }
    } else {
      // Если нет цели, находим следующий узел из текущего
      const nextNode = findNextNode(currentNodeId);
      if (nextNode) {
        setTimeout(() => processNode(nextNode), 500);
      }
    }
  };

  /**
   * Обработка текстового ввода
   *
   * @function handleSendMessage
   * @returns {void}
   */
  const handleSendMessage = () => {
    if (!textInput.trim()) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Добавляем сообщение пользователя
    setMessageHistory(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user',
      text: textInput,
      time: timeString
    }]);

    const inputText = textInput;
    setTextInput('');
    setWaitingForInput(false);

    // Разбор команды, если она начинается с '/'
    if (inputText.startsWith('/')) {
      const parsedCommand = parseCommandFromText(inputText);
      if (parsedCommand) {
        // Поиск узла с соответствующей командой
        const commandNode = nodes.find(node =>
          node.data.command === parsedCommand ||
          (node.data.text || node.data.messageText)?.includes(parsedCommand)
        );
        if (commandNode) {
          setTimeout(() => processNode(commandNode), 500);
          return;
        }
      }
    }

    // Для узлов ввода переходим к следующему узлу
    const currentNode = nodes.find(node => node.id === currentNodeId);
    if (currentNode?.type === 'keyboard' && currentNode.data.action === 'input') {
      const nextNode = findNextNode(currentNodeId);
      if (nextNode) {
        setTimeout(() => processNode(nextNode), 500);
      }
    }
  };

  /**
   * Обработка нажатия клавиши Enter
   *
   * @function handleKeyPress
   * @param {React.KeyboardEvent} e - Объект события клавиатуры
   * @returns {void}
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Обработка клика по кнопке клавиатуры ответов
   *
   * @function handleReplyKeyboardClick
   * @param {Object} button - Объект кнопки
   * @param {string} button.text - Текст кнопки
   * @param {string} [button.target] - Целевой узел
   * @param {string} [button.action] - Действие кнопки
   * @returns {void}
   */
  const handleReplyKeyboardClick = (button: { text: string; target?: string; action?: string; }) => {
    setTextInput(button.text);
    handleSendMessage();
  };

  /**
   * Сброс чата
   *
   * @function resetChat
   * @returns {void}
   */
  const resetChat = () => {
    setMessageHistory([]);
    setCurrentNodeId('');
    setCurrentReplyKeyboard(null);
    setTextInput('');
    setWaitingForInput(false);

    if (startNode) {
      setTimeout(() => processNode(startNode), 500);
    }
  };

  /**
   * Инициализация чата при монтировании компонента или изменении узлов
   */
  useEffect(() => {
    if (startNode && messageHistory.length === 0) {
      processNode(startNode);
    }
  }, [startNode, processNode, messageHistory.length]);

  /**
   * Возврат к редактору
   *
   * @function handleGoBack
   * @returns {void}
   */
  const handleGoBack = () => {
    setLocation(`/editor/${projectId}`);
  };

  /**
   * Обработка изменения вкладки для заголовка
   *
   * @function handleTabChange
   * @param {'editor' | 'preview' | 'export' | 'bot'} tab - Выбранная вкладка
   * @returns {void}
   */
  const handleTabChange = (tab: 'editor' | 'preview' | 'export' | 'bot') => {
    if (tab === 'editor') {
      handleGoBack();
    } else if (tab === 'preview') {
      // Уже на вкладке предварительного просмотра
      return;
    }
    // Для других вкладок потребуется логика навигации, если она реализована
  };

  /**
   * Обработка сохранения (пустая операция для предварительного просмотра)
   *
   * @function handleSave
   * @returns {void}
   */
  const handleSave = () => {
    // Страница предварительного просмотра не сохраняет
  };

  /**
   * Обработка экспорта (может осуществлять навигацию к экспорту или показывать модальное окно)
   *
   * @function handleExport
   * @returns {void}
   */
  const handleExport = () => {
    // Можно реализовать функциональность экспорта
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Проект не найден</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Заголовок */}
      <Header
        projectName={currentProject.name}
        currentTab="preview"
        onTabChange={handleTabChange}
        onSave={handleSave}
        onExport={handleExport}
        isSaving={false}
      />

      {/* Интерфейс чата */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Чат с ботом
              <span className="text-sm font-normal text-muted-foreground ml-auto">
                {messageHistory.length} сообщений
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetChat}
                  data-testid="button-reset"
                >
                  Перезапустить
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  К редактору
                </Button>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Сообщения чата */}
            <div
              ref={chatAreaRef}
              className="flex-1 overflow-y-auto space-y-3 p-2 border rounded bg-muted/20"
              data-testid="chat-area"
            >
              {messageHistory.map((message, index) => (
                <div
                  key={`${message.id}-${index}-${message.time}`}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border'
                  }`}>
                    {/* Содержимое медиа */}
                    {message.mediaType && message.mediaType !== 'location' && message.mediaType !== 'contact' && message.mediaType !== 'poll' && message.mediaType !== 'dice' && (
                      <div className="mb-2">
                        {message.mediaType === 'photo' && (
                          <img src={message.mediaUrl} alt="Фото" className="max-w-full h-auto rounded" />
                        )}
                        {message.mediaType === 'video' && (
                          <video controls className="max-w-full h-auto rounded">
                            <source src={message.mediaUrl} type="video/mp4" />
                            Ваш браузер не поддерживает видео.
                          </video>
                        )}
                        {message.mediaType === 'audio' && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">Аудио сообщение</span>
                            {message.mediaData?.duration && (
                              <span className="text-xs text-muted-foreground">
                                {message.mediaData.duration}с
                              </span>
                            )}
                          </div>
                        )}
                        {message.mediaType === 'document' && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">
                              {message.mediaData?.filename || 'Документ'}
                            </span>
                          </div>
                        )}
                        {message.mediaType === 'sticker' && (
                          <img src={message.mediaUrl} alt="Стикер" className="w-32 h-32 object-contain" />
                        )}
                        {message.mediaType === 'voice' && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">Голосовое сообщение</span>
                            {message.mediaData?.duration && (
                              <span className="text-xs text-muted-foreground">
                                {message.mediaData.duration}с
                              </span>
                            )}
                          </div>
                        )}
                        {message.mediaType === 'animation' && (
                          <img src={message.mediaUrl} alt="Анимация" className="max-w-full h-auto rounded" />
                        )}
                      </div>
                    )}

                    {/* Специальные типы медиа */}
                    {message.mediaType === 'location' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                          <MessageCircle className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{message.mediaData?.title}</div>
                            <div className="text-sm text-muted-foreground">{message.mediaData?.address}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {message.mediaType === 'contact' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                          <Users className="h-4 w-4" />
                          <div>
                            <div className="font-medium">
                              {message.mediaData?.firstName} {message.mediaData?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {message.mediaData?.phoneNumber}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {message.mediaType === 'poll' && (
                      <div className="space-y-2">
                        <div className="font-medium">{message.mediaData?.question}</div>
                        <div className="space-y-1">
                          {message.mediaData?.options?.map((option: string, index: number) => (
                            <div key={index} className="p-2 bg-muted rounded text-sm">
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.mediaType === 'dice' && (
                      <div className="text-center">
                        <div className="text-4xl">{message.mediaData?.emoji}</div>
                      </div>
                    )}

                    {/* Текстовое содержимое */}
                    {message.text && (
                      <div
                        className="text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
                      />
                    )}

                    {/* Подпись к медиа */}
                    {message.mediaCaption && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {message.mediaCaption}
                      </div>
                    )}

                    {/* Встроенные кнопки */}
                    {message.buttons && message.buttons.length > 0 && message.keyboardType === 'inline' && (
                      <div className="mt-2 space-y-1">
                        {message.buttons.map((button, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleButtonClick(button)}
                            data-testid={`button-inline-${index}`}
                          >
                            {button.text}
                          </Button>
                        ))}
                      </div>
                    )}

                    <div className="text-xs opacity-70 mt-1">
                      {message.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Клавиатура ответов */}
            {currentReplyKeyboard && currentReplyKeyboard.length > 0 && (
              <div className="border rounded p-2 bg-muted/20">
                <div className="text-xs text-muted-foreground mb-2">Быстрые ответы:</div>
                <div className="grid grid-cols-2 gap-2">
                  {currentReplyKeyboard.map((button, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleReplyKeyboardClick(button)}
                      data-testid={`button-reply-${index}`}
                    >
                      {button.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Область ввода */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={waitingForInput ? "Введите ответ..." : "Введите сообщение или команду..."}
                className="flex-1"
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!textInput.trim()}
                data-testid="button-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}