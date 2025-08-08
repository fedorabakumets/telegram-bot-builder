import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Node, Connection } from '@shared/schema';
import { parseCommandFromText } from '@/lib/commands';
import { useState, useRef, useEffect } from 'react';

// Функция для рендеринга markdown в HTML
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

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  connections: Connection[];
  projectName: string;
}

export function PreviewModal({ isOpen, onClose, nodes, connections, projectName }: PreviewModalProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
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
    mediaData?: any; // Дополнительные данные для специальных типов медиа
  }>>([]);
  const [currentReplyKeyboard, setCurrentReplyKeyboard] = useState<Array<{ text: string; target?: string; action?: string; }> | null>(null);
  const [textInput, setTextInput] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Find start node or first node
  const startNode = nodes.find(node => node.type === 'start') || nodes[0];

  // Helper function to find next node based on connections
  const findNextNode = (currentNodeId: string, isSuccess: boolean = true) => {
    // Find all connections from current node
    const fromConnections = connections.filter(conn => conn.source === currentNodeId);
    
    if (fromConnections.length === 0) {
      return null;
    }


    // For other node types, return the first connection
    const nextConnection = fromConnections[0];
    return nextConnection ? nodes.find(node => node.id === nextConnection.target) : null;
  };

  // Helper function to get media information from a node
  const getMediaInfo = (node: Node) => {
    switch (node.type) {
      case 'photo':
        return {
          mediaType: 'photo' as const,
          mediaUrl: node.data.imageUrl || 'https://picsum.photos/800/600?random=1',
          mediaCaption: node.data.mediaCaption
        };
      case 'video':
        return {
          mediaType: 'video' as const,
          mediaUrl: node.data.videoUrl || 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          mediaCaption: node.data.mediaCaption
        };
      case 'audio':
        return {
          mediaType: 'audio' as const,
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
          mediaUrl: node.data.documentUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          mediaCaption: node.data.mediaCaption,
          mediaData: {
            filename: node.data.filename || node.data.documentName || 'document.pdf'
          }
        };
      case 'sticker':
        return {
          mediaType: 'sticker' as const,
          mediaUrl: node.data.stickerUrl || 'https://telegram.org/img/t_logo.png',
          mediaCaption: node.data.mediaCaption
        };
      case 'voice':
        return {
          mediaType: 'voice' as const,
          mediaUrl: node.data.voiceUrl || 'https://www.soundjay.com/misc/beep-07a.wav',
          mediaCaption: node.data.mediaCaption,
          mediaData: {
            duration: node.data.duration
          }
        };
      case 'animation':
        return {
          mediaType: 'animation' as const,
          mediaUrl: node.data.animationUrl || 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
          mediaCaption: node.data.mediaCaption
        };
      case 'location':
        return {
          mediaType: 'location' as const,
          mediaData: {
            latitude: node.data.latitude || 55.7558,
            longitude: node.data.longitude || 37.6176,
            title: node.data.title || 'Локация',
            address: node.data.address
          }
        };
      case 'contact':
        return {
          mediaType: 'contact' as const,
          mediaData: {
            firstName: node.data.firstName || 'Имя',
            lastName: node.data.lastName,
            phoneNumber: node.data.phoneNumber
          }
        };
      case 'poll':
        return {
          mediaType: 'poll' as const,
          mediaData: {
            question: node.data.question || 'Вопрос',
            options: node.data.options || ['Вариант 1', 'Вариант 2'],
            allowsMultipleAnswers: node.data.allowsMultipleAnswers,
            anonymousVoting: node.data.anonymousVoting
          }
        };
      case 'dice':
        return {
          mediaType: 'dice' as const,
          mediaData: {
            emoji: node.data.emoji || '🎲'
          }
        };
      default:
        return {};
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messageHistory]);

  const handleStart = () => {
    if (!startNode) return;
    
    const time = new Date().toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const buttons = startNode.data.keyboardType !== 'none' && startNode.data.buttons ? startNode.data.buttons.map(btn => ({
      text: btn.text,
      target: btn.target,
      action: btn.action
    })) : undefined;



    const mediaInfo = getMediaInfo(startNode);

    const botMessage = {
      id: `msg-${Date.now()}`,
      type: 'bot' as const,
      text: startNode.data.messageText || (startNode.type === 'start' ? 'Привет!' : ''),
      time,
      buttons,
      keyboardType: startNode.data.keyboardType,
      ...mediaInfo
    };

    setMessageHistory([botMessage]);
    setCurrentNodeId(startNode.id);
    
    // Set reply keyboard if applicable
    if (startNode.data.keyboardType === 'reply' && buttons) {
      setCurrentReplyKeyboard(buttons);
    } else {
      setCurrentReplyKeyboard(null);
    }
    
    // Check if this node expects input
    const inputNode = nodes.find(node => node.type === 'input');
    setWaitingForInput(!!inputNode && startNode.data.keyboardType === 'none');
  };

  const handleButtonClick = (buttonText: string, target?: string, action?: string) => {
    handleUserMessage(buttonText, target, action);
  };

  const handleUserMessage = (messageText: string, target?: string, action?: string) => {
    const time = new Date().toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      type: 'user' as const,
      text: messageText,
      time
    };

    setMessageHistory(prev => [...prev, userMessage]);
    setWaitingForInput(false);

    // Navigate to target node if exists
    setTimeout(() => {
      if (target) {
        // Find the target node by ID or by command if action is 'command'
        let targetNode;
        if (action === 'command') {
          // Special handling for /start command - restart the bot
          if (target === '/start') {
            // Clear message history and restart
            setTimeout(() => {
              handleStart();
            }, 100);
            return;
          }
          // Find node with matching command
          targetNode = nodes.find(node => 
            (node.type === 'command' || node.type === 'start') && 
            node.data.command === target
          );
        } else {
          // Find node by ID
          targetNode = nodes.find(node => node.id === target);
        }
        
        if (targetNode) {
          // Update current node
          setCurrentNodeId(targetNode.id);
          
          // Get appropriate text and media based on node type
          let responseText = '';
          if (targetNode.data.messageText) {
            responseText = targetNode.data.messageText;
          } else if (targetNode.type === 'command') {
            responseText = `Команда: ${targetNode.data.command || 'Неизвестная команда'}`;
          } else if (targetNode.type === 'start') {
            responseText = `Стартовая команда: ${targetNode.data.command || '/start'}`;
          } else if (targetNode.type === 'input') {
            responseText = 'Ожидаю ввод...';
          } else if (['photo', 'video', 'audio', 'document', 'sticker', 'voice', 'animation'].includes(targetNode.type)) {
            responseText = targetNode.data.mediaCaption || '';
          } else if (targetNode.type === 'location') {
            responseText = targetNode.data.title || 'Локация';
          } else if (targetNode.type === 'contact') {
            responseText = `${targetNode.data.firstName || 'Имя'} ${targetNode.data.lastName || ''}`.trim();
          } else if (targetNode.type === 'poll') {
            responseText = targetNode.data.question || 'Опрос';
          } else if (targetNode.type === 'dice') {
            responseText = `Кубик ${targetNode.data.emoji || '🎲'}`;
          } else {
            responseText = 'Сообщение';
          }

          const targetMediaInfo = getMediaInfo(targetNode);
          
          // Handle buttons
          let buttons;
          if (targetNode.data.keyboardType !== 'none' && targetNode.data.buttons) {
            // Regular buttons for other node types
            buttons = targetNode.data.buttons.map(btn => ({
              text: btn.text,
              target: btn.target,
              action: btn.action
            }));
          }

          // Create bot response from target node
          const keyboardType = targetNode.data.keyboardType;
            
          const botResponse = {
            id: `msg-${Date.now()}-bot`,
            type: 'bot' as const,
            text: responseText,
            time: new Date().toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            buttons,
            keyboardType,
            ...targetMediaInfo
          };

          setMessageHistory(prev => [...prev, botResponse]);
          
          // Update reply keyboard based on target node
          if (targetNode.data.keyboardType === 'reply' && buttons) {
            setCurrentReplyKeyboard(buttons);
          } else if (targetNode.data.keyboardType === 'none') {
            setCurrentReplyKeyboard(null);
          }
          
          // Check if target node expects input
          const expectsTextInput = targetNode.type === 'input' && 
                                  targetNode.data.keyboardType === 'none';
          setWaitingForInput(expectsTextInput);
        } else {
          // Node not found - show error
          let errorText = '';
          if (action === 'command') {
            errorText = `❌ Команда "${target}" не найдена в боте`;
          } else {
            errorText = `❌ Экран с ID "${target}" не найден`;
          }
          
          const errorResponse = {
            id: `msg-${Date.now()}-bot`,
            type: 'bot' as const,
            text: errorText,
            time: new Date().toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          };

          setMessageHistory(prev => [...prev, errorResponse]);
        }
      } else {
        // No target specified - handle free text input
        const defaultResponse = {
          id: `msg-${Date.now()}-bot`,
          type: 'bot' as const,
          text: `Вы написали: "${messageText}"`,
          time: new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };

        setMessageHistory(prev => [...prev, defaultResponse]);
      }
    }, 500);
  };

  const handleSendText = () => {
    if (!textInput.trim()) return;
    
    const userInput = textInput.trim();
    
    // Check if input is a command
    const commandFromText = parseCommandFromText(userInput);
    if (commandFromText) {
      // Find the command node
      const commandNode = nodes.find(node => 
        (node.type === 'command' || node.type === 'start') && 
        node.data.command === commandFromText
      );
      
      if (commandNode) {
        handleUserMessage(userInput, commandNode.id, 'goto');
      } else {
        handleUserMessage(userInput, commandFromText, 'command');
      }
    } else {
      // Check if input matches any node's synonyms
      const synonymNode = nodes.find(node => 
        node.data.synonyms && 
        Array.isArray(node.data.synonyms) &&
        node.data.synonyms.includes(userInput.toLowerCase())
      );
      
      if (synonymNode) {
        handleUserMessage(userInput, synonymNode.id, 'goto');
      } else {
        // Regular text input - check if we're waiting for user input
        if (waitingForInput && currentNodeId) {
          handleUserMessage(userInput);
        } else {
          handleUserMessage(userInput);
        }
      }
    }
    
    setTextInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const reset = () => {
    setMessageHistory([]);
    setCurrentNodeId('');
    setCurrentReplyKeyboard(null);
    setTextInput('');
    setWaitingForInput(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fab fa-telegram-plane text-primary-foreground text-sm"></i>
            </div>
            <div>
              <DialogTitle className="font-semibold text-foreground">Превью бота</DialogTitle>
              <p className="text-xs text-muted-foreground">{projectName}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Chat Area */}
        <div ref={chatAreaRef} className="flex-1 bg-muted/30 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
          {messageHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-robot text-primary text-xl"></i>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Нажмите "Запустить", чтобы протестировать бота</p>
                <button
                  onClick={handleStart}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  disabled={!startNode}
                >
                  {startNode ? 'Запустить бота' : 'Нет стартового узла'}
                </button>
              </div>
            </div>
          ) : (
            messageHistory.map((message) => (
              <div key={message.id}>
                {message.type === 'bot' ? (
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-robot text-white text-xs"></i>
                    </div>
                    <div className="max-w-xs">
                      {/* Media Content */}
                      {message.mediaType === 'photo' && (
                        <div className="bg-white rounded-2xl rounded-tl-lg overflow-hidden shadow-sm mb-1">
                          <img
                            src={message.mediaUrl}
                            alt="Фото"
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://picsum.photos/300/200?random=' + Math.random();
                            }}
                          />
                          {message.mediaCaption && (
                            <div className="px-4 py-2">
                              <div 
                                className="text-sm text-gray-900"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.mediaCaption) }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {message.mediaType === 'video' && (
                        <div className="bg-white rounded-2xl rounded-tl-lg overflow-hidden shadow-sm mb-1">
                          <video
                            src={message.mediaUrl}
                            controls
                            className="w-full h-48 object-cover"
                            poster="https://picsum.photos/300/200?random=video"
                          />
                          {message.mediaCaption && (
                            <div className="px-4 py-2">
                              <div 
                                className="text-sm text-gray-900"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.mediaCaption) }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {message.mediaType === 'audio' && (
                        <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm mb-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-music text-orange-600 text-xs"></i>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {message.mediaData?.performer || 'Аудиофайл'}
                              </p>
                              {message.mediaData?.duration && (
                                <p className="text-xs text-gray-500">{message.mediaData.duration}с</p>
                              )}
                            </div>
                          </div>
                          <audio src={message.mediaUrl} controls className="w-full h-8" />
                          {message.mediaCaption && (
                            <div 
                              className="text-sm text-gray-900 mt-2"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.mediaCaption) }}
                            />
                          )}
                        </div>
                      )}
                      
                      {message.mediaType === 'document' && (
                        <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm mb-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-file-alt text-teal-600 text-xs"></i>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {message.mediaData?.filename || 'Документ'}
                              </p>
                              <a 
                                href={message.mediaUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Открыть документ
                              </a>
                            </div>
                          </div>
                          {message.mediaCaption && (
                            <div 
                              className="text-sm text-gray-900 mt-2"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.mediaCaption) }}
                            />
                          )}
                        </div>
                      )}
                      
                      {message.mediaType === 'sticker' && (
                        <div className="bg-white rounded-2xl rounded-tl-lg overflow-hidden shadow-sm mb-1">
                          <img
                            src={message.mediaUrl}
                            alt="Стикер"
                            className="w-32 h-32 object-contain mx-auto"
                          />
                        </div>
                      )}
                      
                      {message.mediaType === 'voice' && (
                        <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm mb-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-microphone text-green-600 text-xs"></i>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Голосовое сообщение</p>
                              {message.mediaData?.duration && (
                                <p className="text-xs text-gray-500">{message.mediaData.duration}с</p>
                              )}
                            </div>
                          </div>
                          <audio src={message.mediaUrl} controls className="w-full h-8 mt-2" />
                        </div>
                      )}
                      
                      {message.mediaType === 'animation' && (
                        <div className="bg-white rounded-2xl rounded-tl-lg overflow-hidden shadow-sm mb-1">
                          <img
                            src={message.mediaUrl}
                            alt="Анимация"
                            className="w-full h-48 object-cover"
                          />
                          {message.mediaCaption && (
                            <div className="px-4 py-2">
                              <div 
                                className="text-sm text-gray-900"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.mediaCaption) }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {message.mediaType === 'location' && (
                        <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm mb-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-map-marker-alt text-green-600 text-xs"></i>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {message.mediaData?.title || 'Локация'}
                              </p>
                              {message.mediaData?.address && (
                                <p className="text-xs text-gray-500">{message.mediaData.address}</p>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-100 rounded-lg p-3">
                            <p className="text-xs text-gray-600">
                              📍 {message.mediaData?.latitude?.toFixed(4)}, {message.mediaData?.longitude?.toFixed(4)}
                            </p>
                            <a 
                              href={`https://maps.google.com/?q=${message.mediaData?.latitude},${message.mediaData?.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Открыть в картах
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {message.mediaType === 'contact' && (
                        <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm mb-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-user text-blue-600 text-xs"></i>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {message.mediaData?.firstName} {message.mediaData?.lastName}
                              </p>
                              {message.mediaData?.phoneNumber && (
                                <p className="text-xs text-gray-500">{message.mediaData.phoneNumber}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {message.mediaType === 'poll' && (
                        <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm mb-1">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-poll text-purple-600 text-xs"></i>
                            </div>
                            <p className="text-sm font-medium text-gray-900">Опрос</p>
                          </div>
                          <p className="text-sm text-gray-900 mb-3">{message.mediaData?.question}</p>
                          <div className="space-y-2">
                            {message.mediaData?.options?.map((option: string, index: number) => (
                              <div key={index} className="flex items-center space-x-2">
                                <div className="w-4 h-4 border border-gray-300 rounded"></div>
                                <p className="text-sm text-gray-700">{option}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            {message.mediaData?.allowsMultipleAnswers && (
                              <span>Множественный выбор</span>
                            )}
                            {message.mediaData?.anonymousVoting && (
                              <span>Анонимно</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {message.mediaType === 'dice' && (
                        <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm mb-1">
                          <div className="text-center">
                            <div className="text-4xl mb-2">{message.mediaData?.emoji || '🎲'}</div>
                            <p className="text-sm text-gray-600">Бросок кубика</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Text message (if any) */}
                      {message.text && !['poll', 'dice'].includes(message.mediaType || '') && (
                        <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm">
                          <div 
                            className="text-sm text-gray-900"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
                          />
                          <p className="text-xs text-gray-500 mt-1">{message.time}</p>
                        </div>
                      )}
                      
                      {/* Show time for media messages */}
                      {message.mediaType && ['poll', 'dice'].includes(message.mediaType) && (
                        <p className="text-xs text-gray-500 mt-1 px-2">{message.time}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 justify-end">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-tr-lg px-4 py-3 max-w-xs">
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs text-blue-200 mt-1">{message.time}</p>
                    </div>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-user text-gray-600 text-xs"></i>
                    </div>
                  </div>
                )}

                {/* Inline Buttons */}
                {message.type === 'bot' && message.buttons && message.keyboardType === 'inline' && (
                  <div className="ml-10 mt-2">
                    {message.buttons.length <= 2 ? (
                      <div className="space-y-1">
                        {message.buttons.map((button, index) => (
                          <button
                            key={index}
                            onClick={() => handleButtonClick(button.text, button.target, button.action)}
                            className="w-full bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            {button.text}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        {message.buttons.map((button, index) => (
                          <button
                            key={index}
                            onClick={() => handleButtonClick(button.text, button.target, button.action)}
                            className="bg-blue-500 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            {button.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Reply Keyboard */}
        {currentReplyKeyboard && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2">
              <p className="text-xs text-gray-600 mb-2">Reply клавиатура:</p>
              <div className="grid grid-cols-2 gap-2">
                {currentReplyKeyboard.map((button, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(button.text, button.target, button.action)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                  >
                    {button.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Text Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2 mb-3">
            <Input
              ref={inputRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={waitingForInput ? "Бот ожидает ввод..." : "Введите сообщение..."}
              className="flex-1"
              disabled={!messageHistory.length}
            />
            <Button
              onClick={handleSendText}
              disabled={!textInput.trim() || !messageHistory.length}
              size="sm"
            >
              <i className="fas fa-paper-plane"></i>
            </Button>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={reset}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Сбросить
            </button>
            <div className="flex-1"></div>
            <span className="text-xs text-gray-500">
              {messageHistory.length} сообщений
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
