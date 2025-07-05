import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Node } from '@/types/bot';
import { parseCommandFromText } from '@/lib/commands';
import { useState, useRef, useEffect } from 'react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  projectName: string;
}

export function PreviewModal({ isOpen, onClose, nodes, projectName }: PreviewModalProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [messageHistory, setMessageHistory] = useState<Array<{
    id: string;
    type: 'bot' | 'user';
    text: string;
    time: string;
    buttons?: Array<{ text: string; target?: string; action?: string; }>;
    keyboardType?: 'reply' | 'inline' | 'none';
  }>>([]);
  const [currentReplyKeyboard, setCurrentReplyKeyboard] = useState<Array<{ text: string; target?: string; action?: string; }> | null>(null);
  const [textInput, setTextInput] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Find start node or first node
  const startNode = nodes.find(node => node.type === 'start') || nodes[0];

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

    const buttons = startNode.data.keyboardType !== 'none' ? startNode.data.buttons.map(btn => ({
      text: btn.text,
      target: btn.target,
      action: btn.action
    })) : undefined;

    const botMessage = {
      id: `msg-${Date.now()}`,
      type: 'bot' as const,
      text: startNode.data.messageText || 'Привет!',
      time,
      buttons,
      keyboardType: startNode.data.keyboardType
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
          
          // Get appropriate text based on node type
          let responseText = '';
          if (targetNode.data.messageText) {
            responseText = targetNode.data.messageText;
          } else if (targetNode.type === 'command') {
            responseText = `Команда: ${targetNode.data.command || 'Неизвестная команда'}`;
          } else if (targetNode.type === 'start') {
            responseText = `Стартовая команда: ${targetNode.data.command || '/start'}`;
          } else if (targetNode.type === 'input') {
            responseText = 'Ожидаю ввод...';
          } else {
            responseText = 'Сообщение';
          }
          
          const buttons = targetNode.data.keyboardType !== 'none' ? targetNode.data.buttons.map(btn => ({
            text: btn.text,
            target: btn.target,
            action: btn.action
          })) : undefined;

          // Create bot response from target node
          const botResponse = {
            id: `msg-${Date.now()}-bot`,
            type: 'bot' as const,
            text: responseText,
            time: new Date().toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            buttons,
            keyboardType: targetNode.data.keyboardType
          };

          setMessageHistory(prev => [...prev, botResponse]);
          
          // Update reply keyboard based on target node
          if (targetNode.data.keyboardType === 'reply' && buttons) {
            setCurrentReplyKeyboard(buttons);
          } else if (targetNode.data.keyboardType === 'none') {
            setCurrentReplyKeyboard(null);
          }
          
          // Check if target node expects input
          setWaitingForInput(targetNode.type === 'input' && targetNode.data.keyboardType === 'none');
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
      // Regular text input
      handleUserMessage(userInput);
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
                    <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3 max-w-xs shadow-sm">
                      <p className="text-sm text-gray-900">{message.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{message.time}</p>
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
