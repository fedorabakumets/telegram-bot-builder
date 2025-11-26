import { Node, Button } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button as UIButton } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MediaSelector } from '@/components/media/media-selector';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { validateCommand, getCommandSuggestions, STANDARD_COMMANDS } from '@/lib/commands';
import { extractCoordinatesFromUrl, formatCoordinates, getLocationInfo } from '@/lib/map-utils';
import { useState, useMemo, useCallback } from 'react';

import { InlineRichEditor } from './inline-rich-editor';
import { EmojiPicker } from './emoji-picker';
import { Image, Video, Music, FileText, X, Plus, Upload } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

// Переиспользуемый компонент для редактирования синонимов
interface SynonymEditorProps {
  synonyms: string[];
  onUpdate: (synonyms: string[]) => void;
  placeholder?: string;
  title?: string;
  description?: string;
  allNodesFromAllSheets?: Array<{node: Node, sheetName: string}>;
  currentNodeId?: string;
}

const SynonymEditor = ({ synonyms, onUpdate, placeholder = "Например: старт, привет, начать", title = "Синонимы", description, allNodesFromAllSheets = [], currentNodeId }: SynonymEditorProps) => {
  // Функция для проверки дубликатов включая все узлы из всех листов
  const checkDuplicate = (value: string, currentIndex: number): boolean => {
    if (!value.trim()) return false;
    const normalizedValue = value.trim().toLowerCase();
    
    // Проверка в пределах текущих синонимов
    const inCurrentNode = synonyms.some((syn, idx) => 
      idx !== currentIndex && syn.trim().toLowerCase() === normalizedValue
    );
    if (inCurrentNode) return true;
    
    // Проверка во всех других узлах всех листов проекта
    const inOtherNodes = allNodesFromAllSheets.some(({ node }) => 
      node.id !== currentNodeId && 
      (node.data.synonyms || []).some((syn: string) => 
        syn.trim().toLowerCase() === normalizedValue
      )
    );
    return inOtherNodes;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div>
        <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <i className="fas fa-signature text-slate-600 dark:text-slate-400 text-xs sm:text-sm"></i>
          {title}
        </label>
      </div>

      {/* Description */}
      {description && (
        <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/40">
          <i className="fas fa-circle-info text-purple-600 dark:text-purple-400 text-xs sm:text-sm mt-0.5 flex-shrink-0"></i>
          <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 leading-relaxed">
            {description}
          </p>
        </div>
      )}

      {/* Synonyms List */}
      <div className="space-y-2 sm:space-y-2.5">
        {synonyms.map((synonym, index) => {
          const isDuplicate = checkDuplicate(synonym, index);
          return (
            <div key={index} className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="flex-1">
                  <Input
                    value={synonym}
                    onChange={(e) => {
                      const newSynonyms = [...synonyms];
                      newSynonyms[index] = e.target.value;
                      onUpdate(newSynonyms);
                    }}
                    placeholder={placeholder}
                    className={`h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-3.5 border transition-all ${
                      isDuplicate
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-200/50 dark:focus:ring-red-900/50 bg-red-50/30 dark:bg-red-950/20'
                        : 'border-slate-300 dark:border-slate-600 focus:border-purple-500 focus:ring-purple-200/50 dark:focus:ring-purple-900/50'
                    }`}
                  />
                </div>
                <UIButton
                  onClick={() => {
                    const newSynonyms = [...synonyms];
                    newSynonyms.splice(index, 1);
                    onUpdate(newSynonyms);
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-9 sm:h-10 w-9 sm:w-10 p-0 hover:bg-red-100/50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Удалить синоним"
                >
                  <i className="fas fa-trash text-xs sm:text-sm"></i>
                </UIButton>
              </div>
              {isDuplicate && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 pl-3 sm:pl-3.5">
                  <i className="fas fa-exclamation-circle text-xs"></i>
                  <span>Такой синоним уже существует</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Button */}
      <UIButton
        onClick={() => {
          const newSynonyms = [...synonyms, ''];
          onUpdate(newSynonyms);
        }}
        className="w-full h-9 sm:h-10 text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700 shadow-md hover:shadow-lg transition-all text-white"
      >
        <i className="fas fa-plus mr-2"></i>
        <span className="hidden sm:inline">Добавить синоним</span>
        <span className="sm:hidden">Добавить</span>
      </UIButton>
    </div>
  );
};

interface PropertiesPanelProps {
  projectId: number;
  selectedNode: Node | null;
  allNodes?: Node[];
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  onNodeTypeChange?: (nodeId: string, newType: Node['type'], newData: Partial<Node['data']>) => void;
  onButtonAdd: (nodeId: string, button: Button) => void;
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  onButtonDelete: (nodeId: string, buttonId: string) => void;
  // Поддержка межлистовых соединений
  allSheets?: any[];
  currentSheetId?: string;
}

export function PropertiesPanel({ 
  projectId,
  selectedNode,
  allNodes = [],
  onNodeUpdate, 
  onNodeTypeChange,
  onButtonAdd, 
  onButtonUpdate, 
  onButtonDelete,
  allSheets = [],
  currentSheetId
}: PropertiesPanelProps) {
  const { toast } = useToast();
  const [commandInput, setCommandInput] = useState('');
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [urlValidation, setUrlValidation] = useState<{[key: string]: { isValid: boolean; message?: string }}>({});
  const [isBasicSettingsOpen, setIsBasicSettingsOpen] = useState(true);

  // Функция для получения данных по умолчанию для каждого типа узла
  const getDefaultDataForType = (type: Node['type']) => {
    const defaults: Record<Node['type'], any> = {
      message: {},
      photo: { imageUrl: '', mediaCaption: '' },
      video: { videoUrl: '', mediaCaption: '', duration: 0 },
      audio: { audioUrl: '', mediaCaption: '', duration: 0 },
      document: { documentUrl: '', documentName: 'document.pdf', mediaCaption: '' },
      sticker: { stickerUrl: '', stickerFileId: '' },
      voice: { voiceUrl: '', duration: 0 },
      animation: { animationUrl: '', duration: 0, width: 0, height: 0, mediaCaption: '' },
      location: { latitude: 55.7558, longitude: 37.6176, title: 'Москва', address: 'Москва, Россия', foursquareId: '', foursquareType: '' },
      contact: { phoneNumber: '+7 (999) 123-45-67', firstName: 'Имя', lastName: 'Фамилия', userId: 0, vcard: '' },
      keyboard: { keyboardType: 'reply' },
      start: { command: '/start', description: 'Запустить бота', showInMenu: true, isPrivateOnly: false, requiresAuth: false, adminOnly: false, synonyms: [] },
      command: { command: '/custom', description: 'Новая команда', showInMenu: true, isPrivateOnly: false, requiresAuth: false, adminOnly: false, synonyms: [] },
      pin_message: { 
        command: '/pin_message',
        synonyms: ['закрепить', 'прикрепить', 'зафиксировать'],
        disableNotification: false
      },
      unpin_message: { 
        command: '/unpin_message',
        synonyms: ['открепить', 'отцепить', 'убрать закрепление']
      },
      delete_message: { 
        command: '/delete_message',
        synonyms: ['удалить', 'стереть', 'убрать сообщение']
      },
      ban_user: {
        command: '/ban_user',
        synonyms: ['забанить', 'заблокировать', 'бан'],
        reason: 'Нарушение правил группы',
        untilDate: 0
      },
      unban_user: {
        command: '/unban_user',
        synonyms: ['разбанить', 'разблокировать', 'unbан']
      },
      mute_user: {
        command: '/mute_user',
        synonyms: ['замутить', 'заглушить', 'мут'],
        reason: 'Нарушение правил группы',
        duration: 3600,
        canSendMessages: false,
        canSendMediaMessages: false,
        canSendPolls: false,
        canSendOtherMessages: false,
        canAddWebPagePreviews: false,
        canChangeGroupInfo: false,
        canInviteUsers2: false,
        canPinMessages2: false
      },
      unmute_user: {
        command: '/unmute_user',
        synonyms: ['размутить', 'разглушить', 'анмут']
      },
      kick_user: {
        command: '/kick_user',
        synonyms: ['кикнуть', 'исключить', 'выгнать'],
        reason: 'Нарушение правил группы'
      },
      promote_user: {
        command: '/promote_user',
        synonyms: ['повысить', 'назначить админом', 'промоут'],
        canChangeInfo: false,
        canDeleteMessages: true,
        canBanUsers: false,
        canInviteUsers: true,
        canPinMessages: true,
        canAddAdmins: false,
        canRestrictMembers: false,
        canPromoteMembers: false,
        canManageVideoChats: false,
        canManageTopics: false,
        isAnonymous: false
      },
      demote_user: {
        command: '/demote_user',
        synonyms: ['понизить', 'снять с админки', 'демоут']
      },
      admin_rights: {
        command: '/admin_rights',
        description: 'Управление правами администратора',
        synonyms: ['права админа', 'изменить права', 'админ права', 'тг права', 'права'],
        adminUserIdSource: 'last_message',
        adminChatIdSource: 'current_chat',
        keyboardType: 'inline',
        buttons: [
          {
            id: 'perm_change_info',
            text: '🏷️ Изменение профиля',
            action: 'command',
            target: 'toggle_change_info',
            buttonType: 'option',
            skipDataCollection: false,
            hideAfterClick: false
          },
          {
            id: 'perm_delete_messages',
            text: '🗑️ Удаление сообщений',
            action: 'command',
            target: 'toggle_delete_messages',
            buttonType: 'option',
            skipDataCollection: false,
            hideAfterClick: false
          },
          {
            id: 'perm_restrict_members',
            text: '🚫 Блокировка участников',
            action: 'command',
            target: 'toggle_restrict_members',
            buttonType: 'option',
            skipDataCollection: false,
            hideAfterClick: false
          },
          {
            id: 'perm_invite_users',
            text: '📨 Приглашение участников',
            action: 'command',
            target: 'toggle_invite_users',
            buttonType: 'option',
            skipDataCollection: false,
            hideAfterClick: false
          },
          {
            id: 'perm_pin_messages',
            text: '📌 Закрепление сообщений',
            action: 'command',
            target: 'toggle_pin_messages',
            buttonType: 'option',
            skipDataCollection: false,
            hideAfterClick: false
          },
          {
            id: 'perm_manage_video_chats',
            text: '🎥 Управление видеочатами',
            action: 'command',
            target: 'toggle_manage_video_chats',
            buttonType: 'option',
            skipDataCollection: false,
            hideAfterClick: false
          },
          {
            id: 'perm_anonymous',
            text: '🔒 Анонимность',
            action: 'command',
            target: 'toggle_anonymous',
            buttonType: 'option',
            skipDataCollection: false,
            hideAfterClick: false
          },
          {
            id: 'perm_promote_members',
            text: '👑 Назначение администраторов',
            action: 'command',
            target: 'toggle_promote_members',
            buttonType: 'option',
            skipDataCollection: false,
            hideAfterClick: false
          }
        ],
        // Права администратора согласно Telegram Bot API
        can_manage_chat: false,
        can_post_messages: false,
        can_edit_messages: false,
        can_delete_messages: true,
        can_post_stories: false,
        can_edit_stories: false,
        can_delete_stories: false,
        can_manage_video_chats: false,
        can_restrict_members: false,
        can_promote_members: false,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: true,
        can_manage_topics: false,
        is_anonymous: false
      }
    };
    
    return defaults[type] || {};
  };

  // Функция для получения всех узлов из всех листов для межлистовых соединений
  const getAllNodesFromAllSheets = useMemo(() => {
    const allNodesFromSheets: { node: Node; sheetId: string; sheetName: string }[] = [];
    
    if (allSheets && allSheets.length > 0) {
      allSheets.forEach((sheet: any) => {
        if (sheet.nodes) {
          sheet.nodes.forEach((node: Node) => {
            allNodesFromSheets.push({
              node,
              sheetId: sheet.id,
              sheetName: sheet.name
            });
          });
        }
      });
    } else {
      // Если листы не переданы, используем только узлы текущего листа
      allNodes.forEach((node: Node) => {
        allNodesFromSheets.push({
          node,
          sheetId: currentSheetId || 'current',
          sheetName: 'Текущий лист'
        });
      });
    }
    
    return allNodesFromSheets;
  }, [allSheets, allNodes, currentSheetId]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // URL validation function
  const validateUrl = (url: string, type: string): { isValid: boolean; message?: string } => {
    if (!url) return { isValid: true };
    
    try {
      new URL(url);
      
      const validImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const validVideoTypes = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
      const validAudioTypes = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
      
      if (type === 'image' && !validImageTypes.some(ext => url.toLowerCase().includes(ext))) {
        return { isValid: false, message: 'URL должен содержать изображение (JPG, PNG, GIF, WebP)' };
      }
      if (type === 'video' && !validVideoTypes.some(ext => url.toLowerCase().includes(ext))) {
        return { isValid: false, message: 'URL должен содержать видео (MP4, AVI, MOV, MKV, WebM)' };
      }
      if (type === 'audio' && !validAudioTypes.some(ext => url.toLowerCase().includes(ext))) {
        return { isValid: false, message: 'URL должен содержать аудио (MP3, WAV, OGG, M4A, AAC)' };
      }
      
      return { isValid: true };
    } catch {
      return { isValid: false, message: 'Неверный формат URL' };
    }
  };

  // Extract all available questions from keyboard and user-input nodes (including media variables)
  const availableQuestions = useMemo(() => {
    const questions: Array<{name: string, nodeId: string, nodeType: string, mediaType?: string}> = [];
    
    allNodes.forEach(node => {
      
      // From any nodes with additional input collection that have inputVariable
      if (node.data.collectUserInput && node.data.inputVariable) {
        questions.push({
          name: node.data.inputVariable,
          nodeId: node.id,
          nodeType: node.type
        });
      }

      // From nodes with photo input
      if (node.data.enablePhotoInput && node.data.photoInputVariable) {
        questions.push({
          name: node.data.photoInputVariable,
          nodeId: node.id,
          nodeType: node.type,
          mediaType: 'photo'
        });
      }

      // From nodes with video input
      if (node.data.enableVideoInput && node.data.videoInputVariable) {
        questions.push({
          name: node.data.videoInputVariable,
          nodeId: node.id,
          nodeType: node.type,
          mediaType: 'video'
        });
      }

      // From nodes with audio input
      if (node.data.enableAudioInput && node.data.audioInputVariable) {
        questions.push({
          name: node.data.audioInputVariable,
          nodeId: node.id,
          nodeType: node.type,
          mediaType: 'audio'
        });
      }

      // From nodes with document input
      if (node.data.enableDocumentInput && node.data.documentInputVariable) {
        questions.push({
          name: node.data.documentInputVariable,
          nodeId: node.id,
          nodeType: node.type,
          mediaType: 'document'
        });
      }
    });
    
    // Remove duplicates by question name
    const uniqueQuestions = questions.filter((question, index, self) => 
      index === self.findIndex(q => q.name === question.name)
    );
    
    return uniqueQuestions;
  }, [allNodes]);

  // Extract all available variables and split into text and media
  const { textVariables, mediaVariables } = useMemo(() => {
    // Use Map for proper deduplication by variable name
    const variablesMap = new Map<string, {name: string, nodeId: string, nodeType: string, description?: string, mediaType?: string}>();
    
    allNodes.forEach(node => {
      
      // From any nodes with additional input collection that have inputVariable
      if (node.data.collectUserInput && node.data.inputVariable && !variablesMap.has(node.data.inputVariable)) {
        variablesMap.set(node.data.inputVariable, {
          name: node.data.inputVariable,
          nodeId: node.id,
          nodeType: node.type,
          description: `Данные из узла типа ${node.type}`
        });
      }

      // From nodes with photo input
      if (node.data.enablePhotoInput && node.data.photoInputVariable && !variablesMap.has(node.data.photoInputVariable)) {
        variablesMap.set(node.data.photoInputVariable, {
          name: node.data.photoInputVariable,
          nodeId: node.id,
          nodeType: node.type,
          mediaType: 'photo',
          description: 'File ID фотографии'
        });
      }

      // From nodes with video input
      if (node.data.enableVideoInput && node.data.videoInputVariable && !variablesMap.has(node.data.videoInputVariable)) {
        variablesMap.set(node.data.videoInputVariable, {
          name: node.data.videoInputVariable,
          nodeId: node.id,
          nodeType: node.type,
          mediaType: 'video',
          description: 'File ID видео'
        });
      }

      // From nodes with audio input
      if (node.data.enableAudioInput && node.data.audioInputVariable && !variablesMap.has(node.data.audioInputVariable)) {
        variablesMap.set(node.data.audioInputVariable, {
          name: node.data.audioInputVariable,
          nodeId: node.id,
          nodeType: node.type,
          mediaType: 'audio',
          description: 'File ID аудио'
        });
      }

      // From nodes with document input
      if (node.data.enableDocumentInput && node.data.documentInputVariable && !variablesMap.has(node.data.documentInputVariable)) {
        variablesMap.set(node.data.documentInputVariable, {
          name: node.data.documentInputVariable,
          nodeId: node.id,
          nodeType: node.type,
          mediaType: 'document',
          description: 'File ID документа'
        });
      }

      // From nodes with multi-select variable
      if (node.data.allowMultipleSelection && node.data.multiSelectVariable && !variablesMap.has(node.data.multiSelectVariable)) {
        variablesMap.set(node.data.multiSelectVariable, {
          name: node.data.multiSelectVariable,
          nodeId: node.id,
          nodeType: node.type,
          description: 'Множественный выбор (список)'
        });
      }

      // From conditional messages with textInputVariable
      if (node.data.conditionalMessages) {
        node.data.conditionalMessages.forEach((condition: any) => {
          if (condition.textInputVariable && !variablesMap.has(condition.textInputVariable)) {
            variablesMap.set(condition.textInputVariable, {
              name: condition.textInputVariable,
              nodeId: node.id,
              nodeType: 'conditional',
              description: `Условный ввод: ${condition.messageText?.substring(0, 50) || 'Условное сообщение'}...`
            });
          }
        });
      }
    });

    // Add common bot variables (they have priority, so add them last to override)
    const commonVariables = [
      { name: 'user_name', nodeId: 'system', nodeType: 'system', description: 'Имя пользователя' },
      { name: 'user_id', nodeId: 'system', nodeType: 'system', description: 'ID пользователя в Telegram' },
      { name: 'chat_id', nodeId: 'system', nodeType: 'system', description: 'ID чата' },
      { name: 'bot_name', nodeId: 'system', nodeType: 'system', description: 'Имя бота' }
    ];

    commonVariables.forEach(v => {
      if (!variablesMap.has(v.name)) {
        variablesMap.set(v.name, v);
      }
    });
    
    // Convert Map to Array and split into text and media variables
    const allVariables = Array.from(variablesMap.values());
    const text = allVariables.filter(v => !v.mediaType);
    const media = allVariables.filter(v => v.mediaType);
    
    return { textVariables: text, mediaVariables: media };
  }, [allNodes]);

  // Получаем список прикрепленных медиапеременных из node.data.attachedMedia
  const attachedMediaVariables = useMemo(() => {
    if (!selectedNode?.data.attachedMedia || mediaVariables.length === 0) {
      return [];
    }
    
    const attachedMediaNames = selectedNode.data.attachedMedia as string[];
    return mediaVariables.filter(v => attachedMediaNames.includes(v.name));
  }, [selectedNode?.data.attachedMedia, mediaVariables]);
  
  // Обработчик добавления медиапеременной
  const handleMediaVariableSelect = useCallback((variableName: string, mediaType: string) => {
    if (!selectedNode) return;
    
    const currentAttachedMedia = (selectedNode.data.attachedMedia as string[]) || [];
    
    // Проверяем, не добавлена ли уже эта переменная
    if (currentAttachedMedia.includes(variableName)) {
      return;
    }
    
    // Добавляем новую медиапеременную
    const updatedAttachedMedia = [...currentAttachedMedia, variableName];
    onNodeUpdate(selectedNode.id, { attachedMedia: updatedAttachedMedia });
  }, [selectedNode, onNodeUpdate]);
  
  // Обработчик удаления медиапеременной
  const handleMediaVariableRemove = useCallback((variableName: string) => {
    if (!selectedNode) return;
    
    const currentAttachedMedia = (selectedNode.data.attachedMedia as string[]) || [];
    const updatedAttachedMedia = currentAttachedMedia.filter(name => name !== variableName);
    onNodeUpdate(selectedNode.id, { attachedMedia: updatedAttachedMedia });
  }, [selectedNode, onNodeUpdate]);

  // Function to detect conflicts between conditional message rules
  const detectRuleConflicts = useMemo(() => {
    if (!selectedNode?.data.conditionalMessages) return [];
    
    const rules = selectedNode.data.conditionalMessages || [];
    const conflicts: Array<{
      ruleIndex: number;
      conflictType: string;
      description: string;
      severity: 'warning' | 'error';
      suggestion: string;
    }> = [];
    
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const ruleVariables = rule.variableNames || (rule.variableName ? [rule.variableName] : []);
      
      // Check for duplicate rules
      for (let j = i + 1; j < rules.length; j++) {
        const otherRule = rules[j];
        const otherVariables = otherRule.variableNames || (otherRule.variableName ? [otherRule.variableName] : []);
        
        // Same condition type with same variables
        if (rule.condition === otherRule.condition && 
            JSON.stringify(ruleVariables.sort()) === JSON.stringify(otherVariables.sort()) &&
            rule.expectedValue === otherRule.expectedValue &&
            rule.logicOperator === otherRule.logicOperator) {
          conflicts.push({
            ruleIndex: i,
            conflictType: 'duplicate',
            description: `Условие ${i + 1} дублирует условие ${j + 1}`,
            severity: 'error',
            suggestion: 'Удалите одно из дублирующихся условий или измените условия'
          });
        }
        
        // Contradictory rules
        if ((rule.condition === 'user_data_exists' && otherRule.condition === 'user_data_not_exists') ||
            (rule.condition === 'user_data_not_exists' && otherRule.condition === 'user_data_exists')) {
          const hasCommonVariables = ruleVariables.some(v => otherVariables.includes(v));
          if (hasCommonVariables) {
            conflicts.push({
              ruleIndex: i,
              conflictType: 'contradiction',
              description: `Условие ${i + 1} противоречит условию ${j + 1}`,
              severity: 'warning',
              suggestion: 'Проверьте логику: одно условие проверяет существование переменной, другое - отсутствие'
            });
          }
        }
      }
      
      // Check for unreachable rules due to priority
      const higherPriorityRules = rules.filter((r, idx) => 
        idx < i && (r.priority || 0) >= (rule.priority || 0)
      );
      
      for (const higherRule of higherPriorityRules) {
        const higherVariables = higherRule.variableNames || (higherRule.variableName ? [higherRule.variableName] : []);
        if (higherRule.condition === 'first_time' || higherRule.condition === 'returning_user') {
          // These conditions might make subsequent rules unreachable
          conflicts.push({
            ruleIndex: i,
            conflictType: 'unreachable',
            description: `Условие ${i + 1} может быть недостижимо из-за условия выше`,
            severity: 'warning',
            suggestion: 'Проверьте порядок условий и их приоритеты'
          });
        }
      }
      
      // Check for empty variable names
      if ((rule.condition.includes('user_data') || rule.condition.includes('equals') || rule.condition.includes('contains')) && 
          ruleVariables.length === 0) {
        conflicts.push({
          ruleIndex: i,
          conflictType: 'missing_variables',
          description: `Условие ${i + 1} не имеет указанных переменных для проверки`,
          severity: 'error',
          suggestion: 'Выберите хотя бы одну переменную для проверки условия'
        });
      }
      
      // Check for missing expected values
      if ((rule.condition === 'user_data_equals' || rule.condition === 'user_data_contains') && 
          !rule.expectedValue) {
        conflicts.push({
          ruleIndex: i,
          conflictType: 'missing_value',
          description: `Условие ${i + 1} требует указания ожидаемого значения`,
          severity: 'error',
          suggestion: 'Укажите значение для сравнения'
        });
      }
    }
    
    return conflicts;
  }, [selectedNode?.data.conditionalMessages]);

  // Function to auto-fix rule priorities
  const autoFixPriorities = () => {
    if (!selectedNode?.data.conditionalMessages) return;
    
    const rules = [...selectedNode.data.conditionalMessages];
    
    // Assign priorities based on logical order
    rules.forEach((rule, index) => {
      // Higher priority for more specific conditions
      let priority = 0;
      
      if (rule.condition === 'first_time' || rule.condition === 'returning_user') {
        priority = 100; // Highest priority for user type checks
      } else if (rule.condition === 'user_data_equals') {
        priority = 80; // High priority for exact matches
      } else if (rule.condition === 'user_data_contains') {
        priority = 60; // Medium priority for contains checks
      } else if (rule.condition === 'user_data_exists') {
        priority = 40; // Lower priority for existence checks
      } else if (rule.condition === 'user_data_not_exists') {
        priority = 20; // Lowest priority for non-existence checks
      }
      
      // Add bonus for multiple variables (more specific)
      const variableCount = rule.variableNames?.length || (rule.variableName ? 1 : 0);
      priority += variableCount * 5;
      
      rule.priority = priority;
    });
    
    // Sort by priority (highest first)
    rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    onNodeUpdate(selectedNode.id, { conditionalMessages: rules });
  };

  // Валидация команды
  const commandValidation = useMemo(() => {
    if (selectedNode && (
      selectedNode.type === 'start' || 
      selectedNode.type === 'command' ||
      selectedNode.type === 'pin_message' || 
      selectedNode.type === 'unpin_message' || 
      selectedNode.type === 'delete_message' ||
      selectedNode.type === 'ban_user' || 
      selectedNode.type === 'unban_user' || 
      selectedNode.type === 'mute_user' || 
      selectedNode.type === 'unmute_user' || 
      selectedNode.type === 'kick_user' || 
      selectedNode.type === 'promote_user' || 
      selectedNode.type === 'demote_user'
    )) {
      const commandValue = selectedNode.data.command || getDefaultDataForType(selectedNode.type).command || '';
      return validateCommand(commandValue);
    }
    return { isValid: true, errors: [] };
  }, [selectedNode?.data.command, selectedNode?.type]);

  // Автодополнение команд
  const commandSuggestions = useMemo(() => {
    if (commandInput.length > 0) {
      return getCommandSuggestions(commandInput);
    }
    return STANDARD_COMMANDS.slice(0, 5);
  }, [commandInput]);
  if (!selectedNode) {
    return (
      <aside className="w-full h-full bg-background border-l border-border flex flex-col">
        {/* Empty State Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center">
              <i className="fas fa-sliders-h text-muted-foreground text-sm"></i>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Свойства</h2>
              <p className="text-xs text-muted-foreground">Выберите элемент для настройки</p>
            </div>
          </div>
        </div>

        {/* Empty State Content */}
        <div className="flex-1 flex items-center justify-center p-8 empty-state-container">
          <div className="text-center max-w-xs">
            {/* Animated Icon */}
            <div className="relative mx-auto mb-6 empty-state-icon">
              <div className="w-16 h-16 empty-state-icon-bg rounded-2xl flex items-center justify-center mx-auto">
                <i className="fas fa-mouse-pointer text-muted-foreground text-xl transition-all duration-300 hover:text-primary hover:scale-110"></i>
              </div>
              {/* Enhanced pulse effect */}
              <div className="absolute inset-0 w-16 h-16 bg-primary/10 rounded-2xl pulse-primary"></div>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-foreground gradient-text">Выберите элемент</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Нажмите на любой элемент в редакторе, чтобы увидеть его настройки здесь
              </p>
            </div>

            {/* Enhanced Help Tips */}
            <div className="space-y-3">
              <div className="flex items-center text-xs text-muted-foreground empty-state-tip floating-tip">
                <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                  <i className="fas fa-lightbulb text-primary text-xs"></i>
                </div>
                <span>Перетащите компоненты из левой панели</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground empty-state-tip floating-tip">
                <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                  <i className="fas fa-hand-pointer text-primary text-xs"></i>
                </div>
                <span>Кликните по элементу для настройки</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground empty-state-tip floating-tip">
                <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                  <i className="fas fa-magic text-primary text-xs"></i>
                </div>
                <span>Используйте предварительный просмотр для тестирования</span>
              </div>
            </div>
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
    video: 'Видео с текстом',
    audio: 'Аудио сообщение',
    document: 'Документ',
    sticker: 'Стикер',
    voice: 'Голосовое сообщение',
    animation: 'GIF анимация',
    location: 'Местоположение',
    contact: 'Контакт',
    keyboard: 'Клавиатура',
    pin_message: 'Закрепить сообщение',
    unpin_message: 'Открепить сообщение',
    delete_message: 'Удалить сообщение',
    ban_user: 'Заблокировать пользователя',
    unban_user: 'Разблокировать пользователя',
    mute_user: 'Ограничить пользователя',
    unmute_user: 'Снять ограничения',
    kick_user: 'Исключить пользователя',
    promote_user: 'Назначить администратором',
    demote_user: 'Снять с администратора',
    admin_rights: 'Права администратора'
  };

  const nodeIcons = {
    start: 'fas fa-play',
    command: 'fas fa-terminal',
    message: 'fas fa-comment',
    photo: 'fas fa-image',
    video: 'fas fa-video',
    audio: 'fas fa-music',
    document: 'fas fa-file-alt',
    sticker: 'fas fa-smile',
    voice: 'fas fa-microphone',
    animation: 'fas fa-film',
    location: 'fas fa-map-marker-alt',
    contact: 'fas fa-address-book',
    keyboard: 'fas fa-keyboard',
    pin_message: 'fas fa-thumbtack',
    unpin_message: 'fas fa-times',
    delete_message: 'fas fa-trash',
    ban_user: 'fas fa-user-slash',
    unban_user: 'fas fa-user-check',
    mute_user: 'fas fa-volume-mute',
    unmute_user: 'fas fa-volume-up',
    kick_user: 'fas fa-door-open',
    promote_user: 'fas fa-user-shield',
    demote_user: 'fas fa-user-minus',
    admin_rights: 'fas fa-crown'
  };

  const nodeColors = {
    start: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    command: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    message: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    photo: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    video: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    audio: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    document: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    sticker: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    voice: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    animation: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    location: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    contact: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    keyboard: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    pin_message: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    unpin_message: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    delete_message: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    ban_user: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    unban_user: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    mute_user: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    unmute_user: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    kick_user: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    promote_user: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    demote_user: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
    admin_rights: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
  };

  const handleAddButton = () => {
    const newButton: Button = {
      id: nanoid(),
      text: 'Новая кнопка',
      action: 'goto',
      target: '',
      buttonType: 'normal',
      skipDataCollection: false,
      hideAfterClick: false
    };
    onButtonAdd(selectedNode.id, newButton);
  };

  return (
    <aside className="w-full h-full bg-background border-l border-border flex flex-col">
      {/* Properties Header */}
      <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/40 dark:to-slate-900/30 border-b border-border/50 backdrop-blur-sm">
        <div className="p-3 sm:p-4 space-y-3">
          {/* Main Info Row */}
          <div className="space-y-3 sm:space-y-3.5">
            {/* Header with Icon and Title */}
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className={`w-10 sm:w-11 h-10 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm transition-all ${nodeColors[selectedNode.type]}`}>
                <i className={`${nodeIcons[selectedNode.type]} text-base sm:text-lg`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Текущий элемент</p>
                <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent leading-tight truncate">
                  {nodeTypeNames[selectedNode.type]}
                </h2>
              </div>
            </div>

            {/* Type Selector */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <i className="fas fa-exchange-alt text-slate-600 dark:text-slate-400 text-xs sm:text-sm"></i>
                Изменить тип
              </label>
              <Select
                value={selectedNode.type}
                onValueChange={(value) => {
                  if (onNodeTypeChange) {
                    const newData = getDefaultDataForType(value as Node['type']);
                    const preservedData = {
                      messageText: selectedNode.data.messageText,
                      keyboardType: selectedNode.data.keyboardType,
                      buttons: selectedNode.data.buttons,
                      markdown: selectedNode.data.markdown,
                      oneTimeKeyboard: selectedNode.data.oneTimeKeyboard,
                      resizeKeyboard: selectedNode.data.resizeKeyboard
                    };
                    const finalData = { ...newData, ...preservedData };
                    onNodeTypeChange(selectedNode.id, value as Node['type'], finalData);
                  }
                }}
              >
                <SelectTrigger className="w-full text-xs sm:text-sm border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-200/50 dark:focus:ring-blue-900/50 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="message">📝 Текстовое сообщение</SelectItem>
                  <SelectItem value="sticker">😀 Стикер</SelectItem>
                  <SelectItem value="voice">🎤 Голосовое сообщение</SelectItem>
                  <SelectItem value="animation">🎞️ GIF анимация</SelectItem>
                  <SelectItem value="location">📍 Геолокация</SelectItem>
                  <SelectItem value="contact">📞 Контакт</SelectItem>
                  <SelectItem value="start">▶️ /start команда</SelectItem>
                  <SelectItem value="command">🔧 Пользовательская команда</SelectItem>
                  <SelectItem value="pin_message">📌 Закрепить сообщение</SelectItem>
                  <SelectItem value="unpin_message">📌❌ Открепить сообщение</SelectItem>
                  <SelectItem value="delete_message">🗑️ Удалить сообщение</SelectItem>
                  <SelectItem value="ban_user">🚫 Заблокировать пользователя</SelectItem>
                  <SelectItem value="unban_user">✅ Разблокировать пользователя</SelectItem>
                  <SelectItem value="mute_user">🔇 Ограничить пользователя</SelectItem>
                  <SelectItem value="unmute_user">🔊 Снять ограничения</SelectItem>
                  <SelectItem value="kick_user">👢 Исключить пользователя</SelectItem>
                  <SelectItem value="promote_user">👑 Назначить администратором</SelectItem>
                  <SelectItem value="demote_user">👤 Снять с администратора</SelectItem>
                  <SelectItem value="admin_rights">⚡ Права администратора</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* ID Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded-md bg-muted/40">ID:</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedNode.id);
                toast({
                  title: "✅ ID скопирован!",
                  description: `"${selectedNode.id}" в буфер обмена`,
                });
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500/15 to-cyan-500/10 dark:from-blue-600/20 dark:to-cyan-600/15 hover:from-blue-500/25 hover:to-cyan-500/20 dark:hover:from-blue-600/30 dark:hover:to-cyan-600/25 border border-blue-300/40 dark:border-blue-600/40 hover:border-blue-400/60 dark:hover:border-blue-500/60 rounded-lg transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md"
              title="Нажмите, чтобы скопировать ID"
              data-testid="button-copy-node-id"
            >
              <code className="text-xs sm:text-sm font-mono font-semibold text-blue-700 dark:text-blue-300 truncate group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors">
                {selectedNode.id}
              </code>
              <i className="fas fa-copy text-blue-600 dark:text-blue-400 text-xs opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"></i>
            </button>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Настройте параметры выбранного элемента ниже
          </p>
        </div>
      </div>

      {/* Properties Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-5 space-y-4 sm:space-y-5 md:space-y-6">
        
        {/* Basic Settings */}
        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={() => setIsBasicSettingsOpen(!isBasicSettingsOpen)}
            className="flex items-center gap-2 w-full hover:opacity-75 transition-opacity duration-200"
            title={isBasicSettingsOpen ? 'Свернуть' : 'Развернуть'}
          >
            <div className="h-5 w-0.5 bg-gradient-to-b from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-400 rounded-full"></div>
            <h3 className="text-sm sm:text-base font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">Основные настройки</h3>
            <i className={`fas fa-chevron-down text-xs sm:text-sm text-slate-600 dark:text-slate-400 ml-auto transition-transform duration-300 ${isBasicSettingsOpen ? 'rotate-0' : '-rotate-90'}`}></i>
          </button>
          {isBasicSettingsOpen && (
            <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-slate-50/30 to-slate-100/20 dark:from-slate-950/30 dark:to-slate-900/20 rounded-xl p-3 sm:p-4 border border-slate-200/30 dark:border-slate-800/30 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">

            {(selectedNode.type === 'start' || selectedNode.type === 'command') && (
              <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-950/30 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 border border-blue-200/40 dark:border-blue-800/40 backdrop-blur-sm">
                <div className="space-y-3 sm:space-y-4">
                  <div className="relative">
                    <Label className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">Команда</Label>
                    <div className="relative mt-2">
                      <Input
                        value={selectedNode.data.command || getDefaultDataForType(selectedNode.type).command || ''}
                        onChange={(e) => {
                          onNodeUpdate(selectedNode.id, { command: e.target.value });
                          setCommandInput(e.target.value);
                          setShowCommandSuggestions(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowCommandSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCommandSuggestions(false), 200)}
                        className={`text-sm ${!commandValidation.isValid ? 'border-red-500 dark:border-red-500' : 'border-blue-200 dark:border-blue-700'}`}
                        placeholder="/start"
                        data-testid="input-command"
                      />
                      
                      {/* Автодополнение команд */}
                      {showCommandSuggestions && commandSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          {commandSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs sm:text-sm border-b border-blue-100 dark:border-blue-900 last:border-b-0 transition-colors"
                              onClick={() => {
                                onNodeUpdate(selectedNode.id, { 
                                  command: suggestion.command,
                                  description: suggestion.description 
                                });
                                setShowCommandSuggestions(false);
                              }}
                              data-testid={`button-suggestion-${suggestion.command}`}
                            >
                              <div className="font-semibold text-foreground">{suggestion.command}</div>
                              <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Ошибки валидации */}
                    {!commandValidation.isValid && commandValidation.errors.length > 0 && (
                      <div className="mt-2 space-y-1 bg-red-50/60 dark:bg-red-950/20 rounded-lg p-2.5 sm:p-3 border border-red-200/50 dark:border-red-800/50">
                        {commandValidation.errors.map((error, index) => (
                          <div key={index} className="flex items-center text-xs sm:text-sm text-red-700 dark:text-red-400 gap-2">
                            <i className="fas fa-exclamation-circle flex-shrink-0"></i>
                            <span>{error}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 sm:space-y-2.5">
                    <Label className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <i className="fas fa-align-left text-blue-600 dark:text-blue-400 text-xs sm:text-sm"></i>
                      Описание
                    </Label>
                    <Input
                      value={selectedNode.data.description || getDefaultDataForType(selectedNode.type).description || ''}
                      onChange={(e) => onNodeUpdate(selectedNode.id, { description: e.target.value })}
                      placeholder="Например: Начать работу с ботом"
                      className="mt-1.5 sm:mt-2 text-xs sm:text-sm border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200/50"
                      data-testid="input-description"
                    />
                    <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40">
                      <i className="fas fa-lightbulb text-blue-600 dark:text-blue-400 text-xs sm:text-sm mt-0.5 flex-shrink-0"></i>
                      <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                        Используется для меню команд в @BotFather
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Synonyms for start and command nodes */}
            {(selectedNode.type === 'start' || selectedNode.type === 'command') && (
              <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-emerald-50/40 to-green-50/20 dark:from-emerald-950/30 dark:to-green-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-emerald-200/40 dark:border-emerald-800/40 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-tags text-emerald-600 dark:text-emerald-400 text-sm"></i>
                  </div>
                  <Label className="text-sm sm:text-base font-bold text-emerald-900 dark:text-emerald-100">Синонимы команды</Label>
                </div>
                
                <SynonymEditor
                  synonyms={selectedNode.data.synonyms || []}
                  onUpdate={(synonyms) => onNodeUpdate(selectedNode.id, { synonyms })}
                  title="Альтернативные команды"
                  description="Текстовые сообщения, которые будут вызывать эту команду. Например: старт вместо /start"
                  placeholder="Например: старт, привет, начать"
                />
              </div>
            )}

            {/* Command for Content Management and User Management */}
            {(selectedNode.type === 'pin_message' || selectedNode.type === 'unpin_message' || selectedNode.type === 'delete_message' ||
              selectedNode.type === 'ban_user' || selectedNode.type === 'unban_user' || selectedNode.type === 'mute_user' || 
              selectedNode.type === 'unmute_user' || selectedNode.type === 'kick_user' || selectedNode.type === 'promote_user' || 
              selectedNode.type === 'demote_user' || selectedNode.type === 'admin_rights') && (
              <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-red-50/40 to-orange-50/20 dark:from-red-950/30 dark:to-orange-900/20 rounded-xl p-3 sm:p-4 border border-red-200/40 dark:border-red-800/40 backdrop-blur-sm">
                <div className="space-y-2 sm:space-y-2.5">
                  <Label className="text-xs sm:text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                    <i className="fas fa-terminal text-red-600 dark:text-red-400 text-xs sm:text-sm"></i>
                    Команда действия
                  </Label>
                  <Input
                    value={selectedNode.data.command || getDefaultDataForType(selectedNode.type).command || ''}
                    onChange={(e) => onNodeUpdate(selectedNode.id, { command: e.target.value })}
                    className="text-xs sm:text-sm border-red-200 dark:border-red-700 focus:border-red-500 focus:ring-red-200/50"
                    placeholder={
                      selectedNode.type === 'pin_message' ? '/pin_message' :
                      selectedNode.type === 'unpin_message' ? '/unpin_message' :
                      selectedNode.type === 'delete_message' ? '/delete_message' :
                      selectedNode.type === 'ban_user' ? '/ban_user' :
                      selectedNode.type === 'unban_user' ? '/unban_user' :
                      selectedNode.type === 'mute_user' ? '/mute_user' :
                      selectedNode.type === 'unmute_user' ? '/unmute_user' :
                      selectedNode.type === 'kick_user' ? '/kick_user' :
                      selectedNode.type === 'promote_user' ? '/promote_user' :
                      selectedNode.type === 'demote_user' ? '/demote_user' :
                      selectedNode.type === 'admin_rights' ? '/admin_rights' : '/command'
                    }
                    data-testid="input-action-command"
                  />
                  <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-red-50/50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/40">
                    <i className="fas fa-cog text-red-600 dark:text-red-400 text-xs sm:text-sm mt-0.5 flex-shrink-0"></i>
                    <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 leading-relaxed">
                      Основная команда для вызова этого действия
                    </p>
                  </div>
                </div>
              </div>
            )}


          </div>
          )}

          {/* Sticker Configuration */}
          {selectedNode.type === 'sticker' && (
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
                {/* Sticker URL Section */}
                <div className="bg-gradient-to-br from-yellow-50/40 to-orange-50/20 dark:from-yellow-950/30 dark:to-orange-900/20 border border-yellow-200/40 dark:border-yellow-800/40 rounded-xl p-3 sm:p-4 md:p-5 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
                      <i className="fas fa-smile text-yellow-600 dark:text-yellow-400 text-xs"></i>
                    </div>
                    <Label className="text-xs sm:text-sm font-bold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                      <i className="fas fa-smile text-yellow-600 dark:text-yellow-400 text-sm"></i>
                      Настройки стикера
                    </Label>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label className="text-xs sm:text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2 sm:mb-2.5 block flex items-center gap-2">
                        <i className="fas fa-link text-yellow-600 dark:text-yellow-400"></i>
                        URL стикера или file_id
                      </Label>
                      <Input
                        value={selectedNode.data.stickerUrl || selectedNode.data.stickerFileId || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { stickerUrl: e.target.value })}
                        className="text-xs sm:text-sm border-yellow-200 dark:border-yellow-700 focus:border-yellow-500 focus:ring-yellow-200/50"
                        placeholder="CAACAgIAAxkBAAICGGXm2Kv..."
                      />
                      <div className="flex items-start gap-2 sm:gap-2.5 p-2 sm:p-2.5 mt-2 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/30 border border-yellow-200/50 dark:border-yellow-800/40">
                        <i className="fas fa-circle-info text-yellow-600 dark:text-yellow-400 text-xs mt-0.5 flex-shrink-0"></i>
                        <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                          Укажите file_id из Telegram или URL с прямой ссылкой
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs sm:text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2 sm:mb-2.5 block flex items-center gap-2">
                        <i className="fas fa-tag text-yellow-600 dark:text-yellow-400"></i>
                        Набор стикеров
                      </Label>
                      <Input
                        value={selectedNode.data.stickerSetName || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { stickerSetName: e.target.value })}
                        className="text-xs sm:text-sm border-yellow-200 dark:border-yellow-700 focus:border-yellow-500 focus:ring-yellow-200/50"
                        placeholder="mystickerpack_by_mybot"
                      />
                      <div className="flex items-start gap-2 sm:gap-2.5 p-2 sm:p-2.5 mt-2 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/30 border border-yellow-200/50 dark:border-yellow-800/40">
                        <i className="fas fa-circle-info text-yellow-600 dark:text-yellow-400 text-xs mt-0.5 flex-shrink-0"></i>
                        <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                          Название набора стикеров (опционально)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Voice Message Configuration */}
            {selectedNode.type === 'voice' && (
              <div className="space-y-6">
                {/* Voice URL Section */}
                <div className="bg-gradient-to-br from-teal-50/50 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 border border-teal-200/30 dark:border-teal-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                      <i className="fas fa-microphone text-teal-600 dark:text-teal-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-teal-900 dark:text-teal-100">Источник голосового сообщения</Label>
                  </div>
                  
                  <MediaSelector
                    projectId={projectId}
                    value={selectedNode.data.voiceUrl || ''}
                    onChange={(url) => onNodeUpdate(selectedNode.id, { voiceUrl: url })}
                    fileType="audio"
                    placeholder="https://example.com/voice-message.ogg"
                    label="Источник голосового сообщения"
                  />
                  
                  <div className="flex items-center space-x-2 text-xs text-teal-600 dark:text-teal-400 mt-3">
                    <i className="fas fa-check-circle"></i>
                    <span>OGG с OPUS кодеком • Макс. 20MB</span>
                  </div>
                </div>

                {/* Voice Metadata Section */}
                <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10 border border-purple-200/30 dark:border-purple-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <i className="fas fa-info-circle text-purple-600 dark:text-purple-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">Метаданные голосового сообщения</Label>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2 block">
                      <i className="fas fa-clock mr-1"></i>
                      Длительность (секунды)
                    </Label>
                    <Input
                      type="number"
                      value={selectedNode.data.duration || ''}
                      onChange={(e) => onNodeUpdate(selectedNode.id, { duration: parseInt(e.target.value) || 0 })}
                      className="border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-200"
                      placeholder="30"
                      min="0"
                      max="3600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Animation (GIF) Configuration */}
            {selectedNode.type === 'animation' && (
              <div className="space-y-6">
                {/* Animation URL Section */}
                <div className="bg-gradient-to-br from-pink-50/50 to-rose-50/30 dark:from-pink-950/20 dark:to-rose-950/10 border border-pink-200/30 dark:border-pink-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                      <i className="fas fa-film text-pink-600 dark:text-pink-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-pink-900 dark:text-pink-100">Источник GIF анимации</Label>
                  </div>
                  
                  <MediaSelector
                    projectId={projectId}
                    value={selectedNode.data.animationUrl || ''}
                    onChange={(url) => onNodeUpdate(selectedNode.id, { animationUrl: url })}
                    fileType="video"
                    placeholder="https://example.com/awesome-animation.gif"
                    label="Источник анимации"
                  />
                  
                  <div className="flex items-center space-x-2 text-xs text-pink-600 dark:text-pink-400 mt-3">
                    <i className="fas fa-check-circle"></i>
                    <span>GIF, MP4 (анимация) • Макс. 50MB</span>
                  </div>
                </div>

                {/* Animation Metadata Section */}
                <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-200/30 dark:border-orange-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                      <i className="fas fa-cog text-orange-600 dark:text-orange-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-orange-900 dark:text-orange-100">Параметры анимации</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                        <i className="fas fa-arrows-alt-h mr-1"></i>
                        Ширина (px)
                      </Label>
                      <Input
                        type="number"
                        value={selectedNode.data.width || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { width: parseInt(e.target.value) || 0 })}
                        className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
                        placeholder="480"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                        <i className="fas fa-arrows-alt-v mr-1"></i>
                        Высота (px)
                      </Label>
                      <Input
                        type="number"
                        value={selectedNode.data.height || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { height: parseInt(e.target.value) || 0 })}
                        className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
                        placeholder="320"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                        <i className="fas fa-clock mr-1"></i>
                        Длительность (сек)
                      </Label>
                      <Input
                        type="number"
                        value={selectedNode.data.muteDuration || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { muteDuration: parseInt(e.target.value) || 0 })}
                        className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
                        placeholder="5"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                        <i className="fas fa-file mr-1"></i>
                        Название файла
                      </Label>
                      <Input
                        value={selectedNode.data.fileName || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { fileName: e.target.value })}
                        className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
                        placeholder="animation.gif"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Location Configuration */}
            {selectedNode.type === 'location' && (
              <div className="space-y-6">
                {/* Coordinates Section */}
                <div className="bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10 border border-emerald-200/30 dark:border-emerald-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <i className="fas fa-map-marker-alt text-emerald-600 dark:text-emerald-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Координаты местоположения</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2 block">
                        <i className="fas fa-globe mr-1"></i>
                        Широта
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        value={selectedNode.data.latitude || ''}
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value) || 0;
                          onNodeUpdate(selectedNode.id, { latitude: lat });
                          
                          // Автоматически получаем информацию о местоположении если есть обе координаты
                          if (lat && selectedNode.data.longitude) {
                            getLocationInfo(lat, selectedNode.data.longitude)
                              .then(locationInfo => {
                                if (locationInfo) {
                                  onNodeUpdate(selectedNode.id, {
                                    title: locationInfo.title || selectedNode.data.title || 'Местоположение',
                                    address: locationInfo.address || selectedNode.data.address,
                                    city: locationInfo.city || selectedNode.data.city,
                                    country: locationInfo.country || selectedNode.data.country
                                  });
                                  toast({
                                    title: "Информация обновлена",
                                    description: `Автоматически определены: ${locationInfo.city || 'город'}, ${locationInfo.country || 'страна'}`
                                  });
                                }
                              })
                              .catch(console.error);
                          }
                        }}
                        className="border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 focus:ring-emerald-200"
                        placeholder="55.7558"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2 block">
                        <i className="fas fa-globe mr-1"></i>
                        Долгота
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        value={selectedNode.data.longitude || ''}
                        onChange={(e) => {
                          const lng = parseFloat(e.target.value) || 0;
                          onNodeUpdate(selectedNode.id, { longitude: lng });
                          
                          // Автоматически получаем информацию о местоположении если есть обе координаты
                          if (lng && selectedNode.data.latitude) {
                            getLocationInfo(selectedNode.data.latitude, lng)
                              .then(locationInfo => {
                                if (locationInfo) {
                                  onNodeUpdate(selectedNode.id, {
                                    title: locationInfo.title || selectedNode.data.title || 'Местоположение',
                                    address: locationInfo.address || selectedNode.data.address,
                                    city: locationInfo.city || selectedNode.data.city,
                                    country: locationInfo.country || selectedNode.data.country
                                  });
                                  toast({
                                    title: "Информация обновлена",
                                    description: `Автоматически определены: ${locationInfo.city || 'город'}, ${locationInfo.country || 'страна'}`
                                  });
                                }
                              })
                              .catch(console.error);
                          }
                        }}
                        className="border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 focus:ring-emerald-200"
                        placeholder="37.6176"
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                    Основные координаты точки на карте (обязательно)
                  </div>
                </div>

                {/* Location Details Section */}
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200/30 dark:border-blue-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100">Описание местоположения</Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                        <i className="fas fa-tag mr-1"></i>
                        Название места
                      </Label>
                      <Input
                        value={selectedNode.data.title || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { title: e.target.value })}
                        className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                        placeholder="Красная площадь"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                        <i className="fas fa-map-signs mr-1"></i>
                        Адрес
                      </Label>
                      <Input
                        value={selectedNode.data.address || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { address: e.target.value })}
                        className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                        placeholder="Красная площадь, дом 1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                          <i className="fas fa-city mr-1"></i>
                          Город
                        </Label>
                        <Input
                          value={selectedNode.data.city || ''}
                          onChange={(e) => onNodeUpdate(selectedNode.id, { city: e.target.value })}
                          className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                          placeholder="Москва"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                          <i className="fas fa-flag mr-1"></i>
                          Страна
                        </Label>
                        <Input
                          value={selectedNode.data.country || ''}
                          onChange={(e) => onNodeUpdate(selectedNode.id, { country: e.target.value })}
                          className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                          placeholder="Россия"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Foursquare Integration Section */}
                <div className="bg-gradient-to-br from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10 border border-purple-200/30 dark:border-purple-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <i className="fas fa-map text-purple-600 dark:text-purple-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">Foursquare (опционально)</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2 block">
                        <i className="fas fa-hashtag mr-1"></i>
                        Foursquare ID
                      </Label>
                      <Input
                        value={selectedNode.data.foursquareId || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { foursquareId: e.target.value })}
                        className="border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-200"
                        placeholder="4b0588f1f964a52079c525e3"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2 block">
                        <i className="fas fa-layer-group mr-1"></i>
                        Тип места
                      </Label>
                      <Input
                        value={selectedNode.data.foursquareType || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { foursquareType: e.target.value })}
                        className="border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-200"
                        placeholder="arts_entertainment/default"
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    Интеграция с Foursquare для дополнительной информации о месте
                  </div>
                </div>

                {/* Map Services Section */}
                <div className="bg-gradient-to-br from-orange-50/50 to-red-50/30 dark:from-orange-950/20 dark:to-red-950/10 border border-orange-200/30 dark:border-orange-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                      <i className="fas fa-route text-orange-600 dark:text-orange-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-orange-900 dark:text-orange-100">Картографические сервисы</Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                        <i className="fas fa-layer-group mr-1"></i>
                        Сервис карт
                      </Label>
                      <select
                        value={selectedNode.data.mapService || 'custom'}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { mapService: e.target.value as 'custom' | 'yandex' | 'google' | '2gis' })}
                        className="w-full px-3 py-2 border border-orange-200 dark:border-orange-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:border-orange-500 focus:ring-orange-200"
                      >
                        <option value="custom">Пользовательские координаты</option>
                        <option value="yandex">Яндекс Карты</option>
                        <option value="google">Google Maps</option>
                        <option value="2gis">2ГИС</option>
                      </select>
                    </div>

                    {selectedNode.data.mapService === 'yandex' && (
                      <div>
                        <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                          <i className="fas fa-link mr-1"></i>
                          Ссылка на Яндекс Карты
                        </Label>
                        <Input
                          type="url"
                          value={selectedNode.data.yandexMapUrl || ''}
                          onChange={(e) => {
                            const url = e.target.value;
                            onNodeUpdate(selectedNode.id, { yandexMapUrl: url });
                            
                            // Автоматически извлекаем координаты из URL
                            if (url) {
                              const { coordinates, service } = extractCoordinatesFromUrl(url);
                              if (coordinates) {
                                const updates: any = {
                                  latitude: coordinates.latitude,
                                  longitude: coordinates.longitude,
                                  mapService: service
                                };
                                
                                onNodeUpdate(selectedNode.id, updates);
                                
                                // Получаем информацию о местоположении
                                getLocationInfo(coordinates.latitude, coordinates.longitude)
                                  .then(locationInfo => {
                                    if (locationInfo) {
                                      onNodeUpdate(selectedNode.id, {
                                        title: locationInfo.title || selectedNode.data.title || 'Местоположение',
                                        address: locationInfo.address || selectedNode.data.address,
                                        city: locationInfo.city || selectedNode.data.city,
                                        country: locationInfo.country || selectedNode.data.country
                                      });
                                      toast({
                                        title: "Координаты обновлены",
                                        description: `Из Яндекс.Карт: ${locationInfo.city || 'город'}, ${locationInfo.country || 'страна'}`
                                      });
                                    }
                                  })
                                  .catch(console.error);
                              }
                            }
                          }}
                          className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
                          placeholder="https://yandex.ru/maps/..."
                        />
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          Скопируйте ссылку из Яндекс.Карт - координаты извлекутся автоматически
                        </p>
                        {selectedNode.data.yandexMapUrl && selectedNode.data.latitude && selectedNode.data.longitude && (
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                            <i className="fas fa-check-circle mr-1"></i>
                            Координаты: {formatCoordinates(selectedNode.data.latitude, selectedNode.data.longitude)}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedNode.data.mapService === 'google' && (
                      <div>
                        <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                          <i className="fas fa-link mr-1"></i>
                          Ссылка на Google Maps
                        </Label>
                        <Input
                          type="url"
                          value={selectedNode.data.googleMapUrl || ''}
                          onChange={(e) => {
                            const url = e.target.value;
                            onNodeUpdate(selectedNode.id, { googleMapUrl: url });
                            
                            // Автоматически извлекаем координаты из URL
                            if (url) {
                              const { coordinates, service } = extractCoordinatesFromUrl(url);
                              if (coordinates) {
                                const updates: any = {
                                  latitude: coordinates.latitude,
                                  longitude: coordinates.longitude,
                                  mapService: service
                                };
                                
                                onNodeUpdate(selectedNode.id, updates);
                                
                                // Получаем информацию о местоположении
                                getLocationInfo(coordinates.latitude, coordinates.longitude)
                                  .then(locationInfo => {
                                    if (locationInfo) {
                                      onNodeUpdate(selectedNode.id, {
                                        title: locationInfo.title || selectedNode.data.title || 'Местоположение',
                                        address: locationInfo.address || selectedNode.data.address,
                                        city: locationInfo.city || selectedNode.data.city,
                                        country: locationInfo.country || selectedNode.data.country
                                      });
                                      toast({
                                        title: "Координаты обновлены",
                                        description: `Из Google Maps: ${locationInfo.city || 'город'}, ${locationInfo.country || 'страна'}`
                                      });
                                    }
                                  })
                                  .catch(console.error);
                              }
                            }
                          }}
                          className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
                          placeholder="https://maps.google.com/..."
                        />
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          Скопируйте ссылку из Google Maps - координаты извлекутся автоматически
                        </p>
                        {selectedNode.data.googleMapUrl && selectedNode.data.latitude && selectedNode.data.longitude && (
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                            <i className="fas fa-check-circle mr-1"></i>
                            Координаты: {formatCoordinates(selectedNode.data.latitude, selectedNode.data.longitude)}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedNode.data.mapService === '2gis' && (
                      <div>
                        <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                          <i className="fas fa-link mr-1"></i>
                          Ссылка на 2ГИС
                        </Label>
                        <Input
                          type="url"
                          value={selectedNode.data.gisMapUrl || ''}
                          onChange={(e) => {
                            const url = e.target.value;
                            onNodeUpdate(selectedNode.id, { gisMapUrl: url });
                            
                            // Автоматически извлекаем координаты из URL
                            if (url) {
                              const { coordinates, service } = extractCoordinatesFromUrl(url);
                              if (coordinates) {
                                const updates: any = {
                                  latitude: coordinates.latitude,
                                  longitude: coordinates.longitude,
                                  mapService: service
                                };
                                
                                onNodeUpdate(selectedNode.id, updates);
                                
                                // Получаем информацию о местоположении
                                getLocationInfo(coordinates.latitude, coordinates.longitude)
                                  .then(locationInfo => {
                                    if (locationInfo) {
                                      onNodeUpdate(selectedNode.id, {
                                        title: locationInfo.title || selectedNode.data.title || 'Местоположение',
                                        address: locationInfo.address || selectedNode.data.address,
                                        city: locationInfo.city || selectedNode.data.city,
                                        country: locationInfo.country || selectedNode.data.country
                                      });
                                      toast({
                                        title: "Координаты обновлены",
                                        description: `Из 2ГИС: ${locationInfo.city || 'город'}, ${locationInfo.country || 'страна'}`
                                      });
                                    }
                                  })
                                  .catch(console.error);
                              }
                            }
                          }}
                          className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
                          placeholder="https://2gis.ru/..."
                        />
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          Скопируйте ссылку из 2ГИС - координаты извлекутся автоматически
                        </p>
                        {selectedNode.data.gisMapUrl && selectedNode.data.latitude && selectedNode.data.longitude && (
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                            <i className="fas fa-check-circle mr-1"></i>
                            Координаты: {formatCoordinates(selectedNode.data.latitude, selectedNode.data.longitude)}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                          <i className="fas fa-search-plus mr-1"></i>
                          Масштаб карты
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          value={selectedNode.data.mapZoom || 15}
                          onChange={(e) => onNodeUpdate(selectedNode.id, { mapZoom: parseInt(e.target.value) || 15 })}
                          className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
                          placeholder="15"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="showDirections"
                            checked={selectedNode.data.showDirections || false}
                            onChange={(e) => onNodeUpdate(selectedNode.id, { showDirections: e.target.checked })}
                            className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <Label htmlFor="showDirections" className="text-xs font-medium text-orange-700 dark:text-orange-300">
                            Показать маршрут
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="generateMapPreview"
                        checked={selectedNode.data.generateMapPreview !== false}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { generateMapPreview: e.target.checked })}
                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <Label htmlFor="generateMapPreview" className="text-xs font-medium text-orange-700 dark:text-orange-300">
                        Генерировать превью карты с кнопками сервисов
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Configuration */}
            {selectedNode.type === 'contact' && (
              <div className="space-y-6">
                {/* Contact Info Section */}
                <div className="bg-gradient-to-br from-cyan-50/50 to-blue-50/30 dark:from-cyan-950/20 dark:to-blue-950/10 border border-cyan-200/30 dark:border-cyan-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                      <i className="fas fa-address-book text-cyan-600 dark:text-cyan-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">Контактная информация</Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-2 block">
                        <i className="fas fa-phone mr-1"></i>
                        Номер телефона (обязательно)
                      </Label>
                      <Input
                        value={selectedNode.data.phoneNumber || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { phoneNumber: e.target.value })}
                        className="border-cyan-200 dark:border-cyan-700 focus:border-cyan-500 focus:ring-cyan-200"
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-2 block">
                          <i className="fas fa-user mr-1"></i>
                          Имя (обязательно)
                        </Label>
                        <Input
                          value={selectedNode.data.firstName || ''}
                          onChange={(e) => onNodeUpdate(selectedNode.id, { firstName: e.target.value })}
                          className="border-cyan-200 dark:border-cyan-700 focus:border-cyan-500 focus:ring-cyan-200"
                          placeholder="Иван"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-2 block">
                          <i className="fas fa-user mr-1"></i>
                          Фамилия
                        </Label>
                        <Input
                          value={selectedNode.data.lastName || ''}
                          onChange={(e) => onNodeUpdate(selectedNode.id, { lastName: e.target.value })}
                          className="border-cyan-200 dark:border-cyan-700 focus:border-cyan-500 focus:ring-cyan-200"
                          placeholder="Петров"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Contact Details Section */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-200/30 dark:border-indigo-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                      <i className="fas fa-id-card text-indigo-600 dark:text-indigo-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Дополнительные данные</Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2 block">
                        <i className="fas fa-at mr-1"></i>
                        User ID Telegram
                      </Label>
                      <Input
                        type="number"
                        value={selectedNode.data.userId || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { userId: parseInt(e.target.value) || 0 })}
                        className="border-indigo-200 dark:border-indigo-700 focus:border-indigo-500 focus:ring-indigo-200"
                        placeholder="123456789"
                      />
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        ID пользователя в Telegram (если известен)
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2 block">
                        <i className="fas fa-address-card mr-1"></i>
                        vCard данные
                      </Label>
                      <Textarea
                        value={selectedNode.data.vcard || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { vcard: e.target.value })}
                        className="resize-none border-indigo-200 dark:border-indigo-700 focus:border-indigo-500 focus:ring-indigo-200 transition-all duration-200"
                        rows={4}
                        placeholder="BEGIN:VCARD&#10;VERSION:3.0&#10;FN:Иван Петров&#10;TEL:+79991234567&#10;END:VCARD"
                      />
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        Дополнительная контактная информация в формате vCard (опционально)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Management Configuration */}
            {(selectedNode.type === 'pin_message' || selectedNode.type === 'unpin_message' || selectedNode.type === 'delete_message') && (
              <div className="space-y-6">
                {/* Automatic Message Handling Info */}
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200/30 dark:border-blue-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <i className="fas fa-reply text-blue-600 dark:text-blue-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100">Автоматическое управление</Label>
                  </div>
                  
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200/30 dark:border-blue-800/30">
                    <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      <i className="fas fa-info-circle mr-1"></i>
                      Команда будет применена к сообщению, на которое отвечает пользователь. 
                      {selectedNode.type === 'pin_message' && ' Пользователь отвечает на сообщение со словом "закрепить" - сообщение закрепляется.'}
                      {selectedNode.type === 'unpin_message' && ' Пользователь отвечает на сообщение со словом "открепить" - сообщение открепляется.'}
                      {selectedNode.type === 'delete_message' && ' Пользователь отвечает на сообщение со словом "удалить" - сообщение удаляется.'}
                    </div>
                  </div>

                  {selectedNode.type === 'pin_message' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-blue-200/30 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
                        <div className="flex-1">
                          <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            <i className="fas fa-bell-slash mr-1"></i>
                            Тихое закрепление
                          </Label>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Закрепить без уведомления участников
                          </div>
                        </div>
                        <div className="ml-4">
                          <Switch
                            checked={selectedNode.data.disableNotification ?? false}
                            onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { disableNotification: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Synonyms Section for Content Management */}
                <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-200/30 dark:border-green-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <i className="fas fa-tags text-green-600 dark:text-green-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-green-900 dark:text-green-100">Синонимы команды</Label>
                  </div>
                  
                  <SynonymEditor
                    synonyms={(() => {
                      if (!selectedNode.data.synonyms || selectedNode.data.synonyms.length === 0) {
                        const defaultSynonyms = selectedNode.type === 'pin_message' ? ['закрепить', 'прикрепить', 'зафиксировать'] :
                                                selectedNode.type === 'unpin_message' ? ['открепить', 'отцепить', 'убрать закрепление'] :
                                                selectedNode.type === 'delete_message' ? ['удалить', 'стереть', 'убрать сообщение'] : [];
                        if (defaultSynonyms.length > 0) {
                          setTimeout(() => onNodeUpdate(selectedNode.id, { synonyms: defaultSynonyms }), 0);
                          return defaultSynonyms;
                        }
                      }
                      return selectedNode.data.synonyms || [];
                    })()} 
                    onUpdate={(synonyms) => onNodeUpdate(selectedNode.id, { synonyms })}
                    title="Альтернативные команды"
                    description={
                      selectedNode.type === 'pin_message' ? "Команды для закрепления сообщения" :
                      selectedNode.type === 'unpin_message' ? "Команды для открепления сообщения" :
                      selectedNode.type === 'delete_message' ? "Команды для удаления сообщения" : 
                      "Альтернативные команды для этого действия"
                    }
                    placeholder={
                      selectedNode.type === 'pin_message' ? "закрепить, прикрепить, зафиксировать" :
                      selectedNode.type === 'unpin_message' ? "открепить, отцепить, убрать" :
                      selectedNode.type === 'delete_message' ? "удалить, стереть, убрать" : 
                      "команда1, команда2, команда3"
                    }
                  />
                </div>
              </div>
            )}

            {/* User Management Configuration */}
            {(selectedNode.type === 'ban_user' || selectedNode.type === 'unban_user' || selectedNode.type === 'mute_user' || 
              selectedNode.type === 'unmute_user' || selectedNode.type === 'kick_user' || selectedNode.type === 'promote_user' || 
              selectedNode.type === 'demote_user' || selectedNode.type === 'admin_rights') && (
              <div className="space-y-6">

                {/* Reason Section (for ban, mute, kick) */}
                {(selectedNode.type === 'ban_user' || selectedNode.type === 'mute_user' || selectedNode.type === 'kick_user') && (
                  <div className="bg-gradient-to-br from-orange-50/50 to-yellow-50/30 dark:from-orange-950/20 dark:to-yellow-950/10 border border-orange-200/30 dark:border-orange-800/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                        <i className="fas fa-clipboard text-orange-600 dark:text-orange-400 text-xs"></i>
                      </div>
                      <Label className="text-sm font-semibold text-orange-900 dark:text-orange-100">Причина действия</Label>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                        <i className="fas fa-comment mr-1"></i>
                        Причина
                      </Label>
                      <Input
                        value={selectedNode.data.reason || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { reason: e.target.value })}
                        className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
                        placeholder="Нарушение правил группы"
                      />
                    </div>
                  </div>
                )}

                {/* Ban Duration Section (for ban_user) */}
                {selectedNode.type === 'ban_user' && (
                  <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10 border border-purple-200/30 dark:border-purple-800/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                        <i className="fas fa-clock text-purple-600 dark:text-purple-400 text-xs"></i>
                      </div>
                      <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">Длительность бана</Label>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2 block">
                        <i className="fas fa-calendar mr-1"></i>
                        Дата окончания (Unix timestamp)
                      </Label>
                      <Input
                        type="number"
                        value={selectedNode.data.untilDate || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { untilDate: parseInt(e.target.value) || 0 })}
                        className="border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-200"
                        placeholder="0 (навсегда)"
                      />
                      <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        0 = постоянный бан, или Unix timestamp даты окончания
                      </div>
                    </div>
                  </div>
                )}

                {/* Mute Settings Section (for mute_user) */}
                {selectedNode.type === 'mute_user' && (
                  <div className="space-y-6">
                    {/* Duration */}
                    <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-200/30 dark:border-indigo-800/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                          <i className="fas fa-hourglass text-indigo-600 dark:text-indigo-400 text-xs"></i>
                        </div>
                        <Label className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Длительность</Label>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2 block">
                          <i className="fas fa-timer mr-1"></i>
                          Длительность (секунды)
                        </Label>
                        <Input
                          type="number"
                          value={selectedNode.data.muteDuration || ''}
                          onChange={(e) => onNodeUpdate(selectedNode.id, { muteDuration: parseInt(e.target.value) || 3600 })}
                          className="border-indigo-200 dark:border-indigo-700 focus:border-indigo-500 focus:ring-indigo-200"
                          placeholder="3600"
                        />
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                          Количество секунд (3600 = 1 час)
                        </div>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-950/20 dark:to-gray-950/10 border border-slate-200/30 dark:border-slate-800/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center">
                          <i className="fas fa-ban text-slate-600 dark:text-slate-400 text-xs"></i>
                        </div>
                        <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ограничения</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { key: 'canSendMessages', label: 'Отправлять сообщения', icon: 'fas fa-comment' },
                          { key: 'canSendMediaMessages', label: 'Отправлять медиа', icon: 'fas fa-image' },
                          { key: 'canSendPolls', label: 'Создавать опросы', icon: 'fas fa-poll' },
                          { key: 'canSendOtherMessages', label: 'Отправлять стикеры/GIF', icon: 'fas fa-laugh' },
                          { key: 'canAddWebPagePreviews', label: 'Добавлять превью ссылок', icon: 'fas fa-link' },
                          { key: 'canChangeGroupInfo', label: 'Изменять информацию группы', icon: 'fas fa-edit' },
                          { key: 'canInviteUsers2', label: 'Приглашать пользователей', icon: 'fas fa-user-plus' },
                          { key: 'canPinMessages2', label: 'Закреплять сообщения', icon: 'fas fa-thumbtack' }
                        ].map(({ key, label, icon }) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-card/50 border border-slate-200/30 dark:border-slate-800/30">
                            <div className="flex items-center space-x-2">
                              <i className={`${icon} text-slate-600 dark:text-slate-400 text-xs`}></i>
                              <Label className="text-xs text-slate-700 dark:text-slate-300">{label}</Label>
                            </div>
                            <Switch
                              checked={(selectedNode.data as any)[key] ?? false}
                              onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { [key]: checked } as any)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Promote Settings Section (for promote_user) */}
                {selectedNode.type === 'promote_user' && (
                  <div className="bg-gradient-to-br from-yellow-50/50 to-amber-50/30 dark:from-yellow-950/20 dark:to-amber-950/10 border border-yellow-200/30 dark:border-yellow-800/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
                        <i className="fas fa-crown text-yellow-600 dark:text-yellow-400 text-xs"></i>
                      </div>
                      <Label className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Права администратора</Label>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { key: 'canChangeInfo', label: 'Изменять информацию группы', icon: 'fas fa-edit' },
                        { key: 'canDeleteMessages', label: 'Удалять сообщения', icon: 'fas fa-trash' },
                        { key: 'canBanUsers', label: 'Блокировать пользователей', icon: 'fas fa-ban' },
                        { key: 'canInviteUsers', label: 'Приглашать пользователей', icon: 'fas fa-user-plus' },
                        { key: 'canPinMessages', label: 'Закреплять сообщения', icon: 'fas fa-thumbtack' },
                        { key: 'canAddAdmins', label: 'Добавлять администраторов', icon: 'fas fa-user-shield' },
                        { key: 'canRestrictMembers', label: 'Ограничивать участников', icon: 'fas fa-user-lock' },
                        { key: 'canPromoteMembers', label: 'Повышать участников', icon: 'fas fa-arrow-up' },
                        { key: 'canManageVideoChats', label: 'Управлять видеозвонками', icon: 'fas fa-video' },
                        // { key: 'canManageTopics', label: 'Управлять темами', icon: 'fas fa-tags' }, // Архивировано - не используется в обычных группах
                        { key: 'isAnonymous', label: 'Анонимный админ', icon: 'fas fa-user-secret' }
                      ].map(({ key, label, icon }) => (
                        <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-card/50 border border-yellow-200/30 dark:border-yellow-800/30">
                          <div className="flex items-center space-x-2">
                            <i className={`${icon} text-yellow-600 dark:text-yellow-400 text-xs`}></i>
                            <Label className="text-xs text-yellow-700 dark:text-yellow-300">{label}</Label>
                          </div>
                          <Switch
                            checked={(selectedNode.data as any)[key] ?? (key === 'canDeleteMessages' || key === 'canInviteUsers' || key === 'canPinMessages' ? true : false)}
                            onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { [key]: checked } as any)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synonyms Section for User Management */}
                <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-200/30 dark:border-green-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <i className="fas fa-tags text-green-600 dark:text-green-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-green-900 dark:text-green-100">Синонимы команды</Label>
                  </div>
                  
                  <SynonymEditor
                    synonyms={(() => {
                      if (!selectedNode.data.synonyms || selectedNode.data.synonyms.length === 0) {
                        const defaultSynonyms = selectedNode.type === 'ban_user' ? ['забанить', 'заблокировать', 'бан'] :
                                                selectedNode.type === 'unban_user' ? ['разбанить', 'разблокировать', 'unbан'] :
                                                selectedNode.type === 'mute_user' ? ['замутить', 'заглушить', 'мут'] :
                                                selectedNode.type === 'unmute_user' ? ['размутить', 'разглушить', 'анмут'] :
                                                selectedNode.type === 'kick_user' ? ['кикнуть', 'исключить', 'выгнать'] :
                                                selectedNode.type === 'promote_user' ? ['повысить', 'назначить админом', 'промоут'] :
                                                selectedNode.type === 'demote_user' ? ['понизить', 'снять с админки', 'демоут'] :
                                                selectedNode.type === 'admin_rights' ? ['права админа', 'изменить права', 'админ права', 'тг права', 'права'] : [];
                        if (defaultSynonyms.length > 0) {
                          setTimeout(() => onNodeUpdate(selectedNode.id, { synonyms: defaultSynonyms }), 0);
                          return defaultSynonyms;
                        }
                      }
                      return selectedNode.data.synonyms || [];
                    })()} 
                    onUpdate={(synonyms) => onNodeUpdate(selectedNode.id, { synonyms })}
                    title="Альтернативные команды"
                    description={
                      selectedNode.type === 'ban_user' ? "Команды для блокировки пользователя" :
                      selectedNode.type === 'unban_user' ? "Команды для разблокировки пользователя" :
                      selectedNode.type === 'mute_user' ? "Команды для ограничения пользователя" :
                      selectedNode.type === 'unmute_user' ? "Команды для снятия ограничений" :
                      selectedNode.type === 'kick_user' ? "Команды для исключения пользователя" :
                      selectedNode.type === 'promote_user' ? "Команды для назначения администратором" :
                      selectedNode.type === 'demote_user' ? "Команды для снятия с должности администратора" :
                      selectedNode.type === 'admin_rights' ? "Команды для управления правами администратора" : 
                      "Альтернативные команды для этого действия"
                    }
                    placeholder={
                      selectedNode.type === 'ban_user' ? "забанить, заблокировать, бан" :
                      selectedNode.type === 'unban_user' ? "разбанить, разблокировать, unbан" :
                      selectedNode.type === 'mute_user' ? "замутить, заглушить, мут" :
                      selectedNode.type === 'unmute_user' ? "размутить, разглушить, анмут" :
                      selectedNode.type === 'kick_user' ? "кикнуть, исключить, выгнать" :
                      selectedNode.type === 'promote_user' ? "повысить, назначить админом, промоут" :
                      selectedNode.type === 'demote_user' ? "понизить, снять с админки, демоут" :
                      selectedNode.type === 'admin_rights' ? "права админа, изменить права, админ права, тг права, права" : 
                      "команда1, команда2, команда3"
                    }
                  />
                </div>
              </div>
            )}

            {/* Admin Rights Configuration */}
            {selectedNode.type === 'admin_rights' && (
              <div className="space-y-6">
                {/* Информация о функционале */}
                <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10 border border-violet-200/30 dark:border-violet-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                      <i className="fas fa-user-shield text-violet-600 dark:text-violet-400 text-xs"></i>
                    </div>
                    <Label className="text-sm font-semibold text-violet-900 dark:text-violet-100">Права администратора</Label>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-sm text-violet-800 dark:text-violet-200">
                      При вызове команды автоматически отправляется сообщение с 11 инлайн кнопками, показывающими текущие права администратора:
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-violet-600 dark:text-violet-400">• 🏷️ Изменение профиля</div>
                      <div className="text-violet-600 dark:text-violet-400">• 🗑️ Удаление сообщений</div>
                      <div className="text-violet-600 dark:text-violet-400">• 🚫 Блокировка участников</div>
                      <div className="text-violet-600 dark:text-violet-400">• 📨 Приглашение участников</div>
                      <div className="text-violet-600 dark:text-violet-400">• 📌 Закрепление сообщений</div>
                      <div className="text-violet-600 dark:text-violet-400">• 🎥 Управление видеочатами</div>
                      <div className="text-violet-600 dark:text-violet-400">• 📰 Публикация историй</div>
                      <div className="text-violet-600 dark:text-violet-400">• ✏️ Редактирование историй</div>
                      <div className="text-violet-600 dark:text-violet-400">• 🗑️ Удаление историй</div>
                      <div className="text-violet-600 dark:text-violet-400">• 🔒 Анонимность</div>
                      <div className="text-violet-600 dark:text-violet-400">• 👑 Назначение администраторов</div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-violet-100/50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
                      <div className="text-xs text-violet-700 dark:text-violet-300 font-medium mb-1">
                        💡 Автоматическое определение участника:
                      </div>
                      <div className="text-xs text-violet-600 dark:text-violet-400">
                        • При ответе на сообщение — права того, кто отправил сообщение<br/>
                        • При упоминании (@username) — права упомянутого пользователя<br/>
                        • При добавлении ID в команду — права указанного участника
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            )}

          </div>
        </div>

        {/* Message Content - скрыто для узлов управления */}
        {selectedNode.type !== 'pin_message' && 
         selectedNode.type !== 'unpin_message' && 
         selectedNode.type !== 'delete_message' &&
         selectedNode.type !== 'ban_user' && 
         selectedNode.type !== 'unban_user' && 
         selectedNode.type !== 'mute_user' && 
         selectedNode.type !== 'unmute_user' && 
         selectedNode.type !== 'kick_user' && 
         selectedNode.type !== 'promote_user' && 
         selectedNode.type !== 'demote_user' && 
         selectedNode.type !== 'admin_rights' && (
        <div>
          <div className="space-y-4">
            {/* Media Variables Section */}
            {attachedMediaVariables.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Прикрепленные медиа</Label>
                <div className="flex flex-wrap gap-2">
                  {attachedMediaVariables.map((variable) => {
                    const getMediaIcon = () => {
                      switch (variable.mediaType) {
                        case 'photo': return <Image className="h-3 w-3" />;
                        case 'video': return <Video className="h-3 w-3" />;
                        case 'audio': return <Music className="h-3 w-3" />;
                        case 'document': return <FileText className="h-3 w-3" />;
                        default: return null;
                      }
                    };

                    const getMediaColor = () => {
                      switch (variable.mediaType) {
                        case 'photo': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
                        case 'video': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
                        case 'audio': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
                        case 'document': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700';
                        default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
                      }
                    };

                    return (
                      <div
                        key={`${variable.nodeId}-${variable.name}`}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium ${getMediaColor()}`}
                      >
                        {getMediaIcon()}
                        <code className="font-mono">{`{${variable.name}}`}</code>
                        <span className="text-[10px] opacity-70">{variable.description}</span>
                        <button
                          onClick={() => handleMediaVariableRemove(variable.name)}
                          className="ml-1 text-xs opacity-50 hover:opacity-100 transition-opacity"
                          title="Удалить медиафайл"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  Эти переменные содержат file_id медиафайлов, полученных от пользователей
                </div>
              </div>
            )}

            {/* Message Text Section */}
            <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-950/30 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-200/40 dark:border-blue-800/40 backdrop-blur-sm">
              {/* Header */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-message text-blue-600 dark:text-blue-400 text-sm sm:text-base"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold bg-gradient-to-r from-blue-900 to-cyan-800 dark:from-blue-100 dark:to-cyan-200 bg-clip-text text-transparent">Текст сообщения</h3>
                  <p className="text-xs sm:text-sm text-blue-700/70 dark:text-blue-300/70 mt-0.5">Основное содержание для отправки пользователю</p>
                </div>
              </div>

              {/* Text Editor */}
              <div className="space-y-2 sm:space-y-2.5">
                <InlineRichEditor
                  value={selectedNode.data.messageText || ''}
                  onChange={(value) => onNodeUpdate(selectedNode.id, { messageText: value })}
                  placeholder="Введите текст сообщения..."
                  enableMarkdown={selectedNode.data.markdown}
                  onMarkdownToggle={(enabled) => onNodeUpdate(selectedNode.id, { markdown: enabled })}
                  onFormatModeChange={(formatMode) => onNodeUpdate(selectedNode.id, { formatMode })}
                  availableVariables={[...textVariables, ...mediaVariables]}
                  onMediaVariableSelect={handleMediaVariableSelect}
                />
                <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40">
                  <i className="fas fa-lightbulb text-blue-600 dark:text-blue-400 text-xs sm:text-sm mt-0.5 flex-shrink-0"></i>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    Поддерживает переменные вида {'{name}'}, Markdown форматирование и медиафайлы
                  </p>
                </div>
              </div>

              {/* File Attachment - скрыто для узлов управления */}
              {selectedNode.type !== 'pin_message' && 
               selectedNode.type !== 'unpin_message' && 
               selectedNode.type !== 'delete_message' &&
               selectedNode.type !== 'ban_user' && 
               selectedNode.type !== 'unban_user' && 
               selectedNode.type !== 'mute_user' && 
               selectedNode.type !== 'unmute_user' && 
               selectedNode.type !== 'kick_user' && 
               selectedNode.type !== 'promote_user' && 
               selectedNode.type !== 'demote_user' && 
               selectedNode.type !== 'admin_rights' && (
              <div className="space-y-2 sm:space-y-2.5 pt-2 sm:pt-3 border-t border-blue-200/40 dark:border-blue-800/40">
                <label className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <i className="fas fa-paperclip text-blue-600 dark:text-blue-400 text-xs sm:text-sm"></i>
                  Прикрепленный медиафайл
                </label>
                <MediaSelector
                  projectId={projectId}
                  value={selectedNode.data.imageUrl || selectedNode.data.videoUrl || selectedNode.data.audioUrl || selectedNode.data.documentUrl || ''}
                  onChange={(url: string, fileName?: string) => {
                    if (!url) {
                      onNodeUpdate(selectedNode.id, {
                        imageUrl: undefined,
                        videoUrl: undefined,
                        audioUrl: undefined,
                        documentUrl: undefined,
                        documentName: undefined
                      });
                      return;
                    }
                    
                    const extension = url.split('.').pop()?.toLowerCase();
                    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
                    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
                    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
                    
                    const updates: Partial<Node['data']> = {
                      imageUrl: undefined,
                      videoUrl: undefined,
                      audioUrl: undefined,
                      documentUrl: undefined,
                      documentName: undefined
                    };
                    
                    if (imageExtensions.includes(extension || '')) {
                      updates.imageUrl = url;
                    } else if (videoExtensions.includes(extension || '')) {
                      updates.videoUrl = url;
                    } else if (audioExtensions.includes(extension || '')) {
                      updates.audioUrl = url;
                    } else {
                      updates.documentUrl = url;
                      updates.documentName = fileName || 'document';
                    }
                    
                    onNodeUpdate(selectedNode.id, updates);
                  }}
                  label=""
                  placeholder="Выберите медиафайл или введите URL"
                />
              </div>
              )}
            </div>
          </div>
        </div>
        )}


        {/* Keyboard Settings - скрыто для узлов управления */}
        {selectedNode.type !== 'pin_message' && 
         selectedNode.type !== 'unpin_message' && 
         selectedNode.type !== 'delete_message' &&
         selectedNode.type !== 'ban_user' && 
         selectedNode.type !== 'unban_user' && 
         selectedNode.type !== 'mute_user' && 
         selectedNode.type !== 'unmute_user' && 
         selectedNode.type !== 'kick_user' && 
         selectedNode.type !== 'promote_user' && 
         selectedNode.type !== 'demote_user' && 
         selectedNode.type !== 'admin_rights' && (
        <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-amber-50/40 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10 border border-amber-200/30 dark:border-amber-800/30 rounded-xl p-3 sm:p-4 md:p-5 backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-keyboard text-amber-600 dark:text-amber-400 text-sm sm:text-base"></i>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-100">Клавиатура</h3>
            </div>
            {selectedNode.data.keyboardType !== 'none' && (
              <Badge variant="secondary" className="text-xs font-medium ml-auto">
                {selectedNode.data.keyboardType === 'inline' ? '📍 Inline' : '💬 Reply'}
              </Badge>
            )}
          </div>

          {/* Keyboard Type Selection */}
          <div className="space-y-2.5 sm:space-y-3">
            <label className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <i className="fas fa-cog text-amber-600 dark:text-amber-400 text-xs"></i>
              Тип клавиатуры
            </label>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-white/50 dark:bg-slate-950/30 border border-amber-200/40 dark:border-amber-800/40 hover:border-amber-300/60 dark:hover:border-amber-700/60 hover:bg-white/70 dark:hover:bg-slate-900/50 transition-all duration-200">
                <label className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-100 cursor-pointer">
                  Inline
                </label>
                <Switch
                  checked={selectedNode.data.keyboardType === 'inline'}
                  onCheckedChange={(checked) => {
                    onNodeUpdate(selectedNode.id, { keyboardType: checked ? 'inline' : 'none' });
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-white/50 dark:bg-slate-950/30 border border-amber-200/40 dark:border-amber-800/40 hover:border-amber-300/60 dark:hover:border-amber-700/60 hover:bg-white/70 dark:hover:bg-slate-900/50 transition-all duration-200">
                <label className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-100 cursor-pointer">
                  Reply
                </label>
                <Switch
                  checked={selectedNode.data.keyboardType === 'reply'}
                  onCheckedChange={(checked) => {
                    onNodeUpdate(selectedNode.id, { keyboardType: checked ? 'reply' : 'none' });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">

            {/* Multiple Selection Setting */}
            {selectedNode.data.keyboardType !== 'none' && (
              <>
                <div className="border-t border-border/20 pt-4"></div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50/40 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-200/40 dark:border-blue-800/30 hover:border-blue-300/60 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all duration-200 group">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-200/50 dark:bg-blue-900/40 group-hover:bg-blue-300/50 dark:group-hover:bg-blue-800/50 transition-all">
                      <i className="fas fa-list-check text-xs sm:text-sm text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 cursor-pointer block">
                        Множественный выбор
                      </Label>
                      <div className="text-xs text-blue-700/70 dark:text-blue-300/70 mt-0.5 leading-snug">
                        {selectedNode.data.keyboardType === 'inline' 
                          ? 'Отметки без перехода'
                          : 'Обновление после выбора'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 self-start sm:self-center">
                    <Switch
                      checked={selectedNode.data.allowMultipleSelection ?? false}
                      onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { allowMultipleSelection: checked })}
                    />
                  </div>
                </div>

                {/* Multiple Selection Settings */}
                {selectedNode.data.allowMultipleSelection && (
                  <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-teal-50/40 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 border border-teal-200/40 dark:border-teal-800/30 hover:border-teal-300/60 dark:hover:border-teal-700/60 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 transition-all duration-200 group">
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-200/50 dark:bg-teal-900/40 group-hover:bg-teal-300/50 dark:group-hover:bg-teal-800/50 transition-all">
                        <i className="fas fa-tag text-xs sm:text-sm text-teal-600 dark:text-teal-400"></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <Label className="text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-100 cursor-pointer block">
                          Переменная для сохранения
                        </Label>
                        <div className="text-xs text-teal-700/70 dark:text-teal-300/70 mt-0.5 leading-snug">
                          Опции сохраняются в переменную
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-white/60 dark:bg-slate-950/60 border border-teal-300/40 dark:border-teal-700/40 hover:border-teal-400/60 dark:hover:border-teal-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus-within:border-teal-500 dark:focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-400/30 dark:focus-within:ring-teal-600/30 transition-all duration-200">
                      <i className="fas fa-code text-xs sm:text-sm text-teal-600 dark:text-teal-400 flex-shrink-0"></i>
                      <Input
                        value={selectedNode.data.multiSelectVariable || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { multiSelectVariable: e.target.value })}
                        className="flex-1 text-xs sm:text-sm bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-teal-900 dark:text-teal-50 placeholder:text-teal-500/50 dark:placeholder:text-teal-400/50 p-0"
                        placeholder="выбранные_опции"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Buttons List */}
            {selectedNode.data.keyboardType !== 'none' && (
              <div className="space-y-3">
                <div className="border-t border-border/20 pt-4"></div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-50/40 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-200/40 dark:border-orange-800/30 hover:border-orange-300/60 dark:hover:border-orange-700/60 hover:bg-orange-50/60 dark:hover:bg-orange-950/30 transition-all duration-200 group">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-200/50 dark:bg-orange-900/40 group-hover:bg-orange-300/50 dark:group-hover:bg-orange-800/50 transition-all">
                      <i className="fas fa-square-plus text-xs sm:text-sm text-orange-600 dark:text-orange-400"></i>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs sm:text-sm font-semibold text-orange-900 dark:text-orange-100 cursor-pointer block">
                        Кнопки
                      </Label>
                      <div className="text-xs text-orange-700/70 dark:text-orange-300/70 mt-0.5 leading-snug">
                        Добавляйте и управляйте кнопками
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-nowrap overflow-x-auto justify-end">
                    <UIButton
                      size="sm"
                      variant="outline"
                      onClick={handleAddButton}
                      className="text-xs font-medium h-8 px-2 border-orange-300/50 dark:border-orange-700/50 text-orange-700 dark:text-orange-300 hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-all"
                    >
                      <i className="fas fa-plus text-xs mr-1.5"></i>
                      <span className="hidden sm:inline">Кнопка</span>
                    </UIButton>
                    {selectedNode.data.allowMultipleSelection && (
                      <>
                        <UIButton
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newButton = {
                              id: Date.now().toString(),
                              text: 'Новая опция',
                              action: 'selection' as const,
                              target: '',
                              buttonType: 'option' as const,
                              skipDataCollection: false,
                              hideAfterClick: false
                            };
                            
                            const currentButtons = selectedNode.data.buttons || [];
                            const updatedButtons = [...currentButtons, newButton];
                            onNodeUpdate(selectedNode.id, { buttons: updatedButtons });
                          }}
                          className="text-xs font-medium h-8 px-2 border-green-300/50 dark:border-green-700/50 text-green-700 dark:text-green-300 hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-all"
                        >
                          <i className="fas fa-check text-xs mr-1.5"></i>
                          <span className="hidden sm:inline">Опция</span>
                        </UIButton>
                        <UIButton
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newButton = {
                              id: Date.now().toString(),
                              text: 'Готово',
                              action: 'goto' as const,
                              target: '',
                              buttonType: 'complete' as const,
                              skipDataCollection: false,
                              hideAfterClick: false
                            };
                            
                            const currentButtons = selectedNode.data.buttons || [];
                            const updatedButtons = [...currentButtons, newButton];
                            onNodeUpdate(selectedNode.id, { buttons: updatedButtons });
                          }}
                          className="text-xs font-medium h-8 px-2 border-purple-300/50 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all"
                        >
                          <i className="fas fa-flag-checkered text-xs mr-1.5"></i>
                          <span className="hidden sm:inline">Завершение</span>
                        </UIButton>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Show Continue Button for Multiple Selection */}
                  {selectedNode.data.allowMultipleSelection && (
                    <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={selectedNode.data.continueButtonText || 'Готово'}
                          onChange={(e) => onNodeUpdate(selectedNode.id, { continueButtonText: e.target.value })}
                          className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Готово"
                        />
                        <div className="flex items-center gap-2">
                          {/* Button Type Indicator */}
                          <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs font-medium">
                            Завершение
                          </div>
                          <button
                            onClick={() => {
                              // No delete action for auto-generated button, just show info
                              toast({
                                title: "Автоматическая кнопка",
                                description: "Эта кнопка генерируется автоматически для завершения выбора",
                              });
                            }}
                            className="text-xs text-muted-foreground hover:text-destructive p-1"
                          >
                            <i className="fas fa-info-circle"></i>
                          </button>
                        </div>
                      </div>

                      {/* Button Type Selection - Disabled for continue button */}
                      <div className="mb-2">
                        <Label className="text-xs font-medium text-muted-foreground mb-1">Тип кнопки</Label>
                        <Select value="complete" disabled>
                          <SelectTrigger className="text-xs opacity-60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="complete">Кнопка завершения</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-muted-foreground mt-1">
                          Сохраняет выбранные опции и переходит к следующему экрану
                        </div>
                      </div>

                      {/* Continue Button Target */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Выберите экран</Label>
                        <Select
                          value={selectedNode.data.continueButtonTarget || 'none'}
                          onValueChange={(value) => onNodeUpdate(selectedNode.id, { continueButtonTarget: value === 'none' ? '' : value })}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Или введите ID вручную" />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 overflow-y-auto">
                            <SelectItem value="none">Не выбрано</SelectItem>
                            {getAllNodesFromAllSheets
                              .filter(n => n.node.id !== selectedNode.id)
                              .map(({node, sheetName}) => (
                                <SelectItem key={node.id} value={node.id}>
                                  <div className="flex items-center space-x-2">
                                    <i className={`${nodeIcons[node.type]} text-xs`}></i>
                                    <span className="truncate">{node.id}</span>
                                    <span className="text-muted-foreground text-xs">({nodeTypeNames[node.type]})</span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400">({sheetName})</span>
                                  </div>
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <Input
                          value={selectedNode.data.continueButtonTarget || ''}
                          onChange={(e) => onNodeUpdate(selectedNode.id, { continueButtonTarget: e.target.value })}
                          className="text-xs"
                          placeholder="Или введите ID вручную"
                        />
                      </div>
                    </div>
                  )}
                  
                  {(selectedNode.data.buttons || []).map((button) => (
                    <div key={button.id} className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50/40 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-200/40 dark:border-blue-800/30 hover:border-blue-300/60 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all duration-200 group">
                      {/* Header with icon, title and delete button */}
                      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-between">
                        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                          <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-200/50 dark:bg-blue-900/40 group-hover:bg-blue-300/50 dark:group-hover:bg-blue-800/50 transition-all">
                            <i className="fas fa-rectangle-ad text-xs sm:text-sm text-blue-600 dark:text-blue-400"></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">
                              Кнопка
                            </div>
                            {selectedNode.data.allowMultipleSelection && button.buttonType && (
                              <Badge variant="outline" className="text-xs h-5 mt-1">
                                {button.buttonType === 'option' && '🟢 Опция'}
                                {button.buttonType === 'complete' && '🟣 Завершение'}
                                {button.buttonType === 'normal' && '🔵 Обычная'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <UIButton
                          size="sm"
                          variant="ghost"
                          onClick={() => onButtonDelete(selectedNode.id, button.id)}
                          className="text-blue-600 hover:text-red-600 dark:text-blue-400 dark:hover:text-red-400 h-auto p-1.5 transition-colors duration-200 flex-shrink-0"
                          title="Удалить кнопку"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </UIButton>
                      </div>

                      {/* Text input and variables button */}
                      <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-purple-50/40 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 border border-purple-200/40 dark:border-purple-800/30 hover:border-purple-300/60 dark:hover:border-purple-700/60 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 transition-all duration-200 group">
                        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                          <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-200/50 dark:bg-purple-900/40 group-hover:bg-purple-300/50 dark:group-hover:bg-purple-800/50 transition-all">
                            <i className="fas fa-keyboard text-xs sm:text-sm text-purple-600 dark:text-purple-400"></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <Label className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-100 cursor-pointer block">
                              Текст кнопки
                            </Label>
                            <div className="text-xs text-purple-700/70 dark:text-purple-300/70 mt-0.5 leading-snug hidden sm:block">
                              Введите текст или вставьте переменную
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-white/60 dark:bg-slate-950/60 border border-purple-300/40 dark:border-purple-700/40 hover:border-purple-400/60 dark:hover:border-purple-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus-within:border-purple-500 dark:focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-400/30 dark:focus-within:ring-purple-600/30 transition-all duration-200">
                          <Input
                            value={button.text}
                            onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { text: e.target.value })}
                            className="flex-1 text-xs sm:text-sm bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-purple-900 dark:text-purple-50 placeholder:text-purple-500/50 dark:placeholder:text-purple-400/50 p-0"
                            placeholder="Введите текст кнопки"
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <UIButton
                                size="sm"
                                variant="ghost"
                                className="h-6 sm:h-7 w-6 sm:w-7 p-0 flex-shrink-0 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all"
                                title="Вставить переменную"
                              >
                                <Plus className="h-4 w-4" />
                              </UIButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 sm:w-80 md:w-96 bg-gradient-to-br from-purple-50/95 to-pink-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-purple-200/50 dark:border-purple-800/50 shadow-xl">
                              <div className="px-3 py-3 sm:py-4">
                                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                                  <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-200/60 dark:bg-purple-900/50">
                                    <i className="fas fa-code text-xs sm:text-sm text-purple-600 dark:text-purple-300"></i>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs sm:text-sm font-bold text-purple-900 dark:text-purple-100">
                                      Доступные переменные
                                    </div>
                                    <div className="text-xs text-purple-700/70 dark:text-purple-300/60 mt-0.5 leading-tight hidden sm:block">
                                      Нажмите на переменную, чтобы вставить
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <DropdownMenuSeparator className="bg-purple-200/30 dark:bg-purple-800/30 mx-0" />
                              
                              <div className="max-h-96 overflow-y-auto">
                                {textVariables.length > 0 ? (
                                  <div className="p-2 space-y-2">
                                    {textVariables.map((variable, index) => {
                                      const getIcon = () => {
                                        if (variable.nodeType === 'user-input') return 'fa-keyboard';
                                        if (variable.nodeType === 'system') return 'fa-cog';
                                        if (variable.nodeType === 'start' || variable.nodeType === 'command') return 'fa-terminal';
                                        if (variable.nodeType === 'conditional') return 'fa-code-branch';
                                        return 'fa-cube';
                                      };
                                      
                                      const getColor = () => {
                                        if (variable.nodeType === 'user-input') return 'from-blue-400 to-blue-500';
                                        if (variable.nodeType === 'system') return 'from-teal-400 to-teal-500';
                                        if (variable.nodeType === 'start' || variable.nodeType === 'command') return 'from-orange-400 to-orange-500';
                                        if (variable.nodeType === 'conditional') return 'from-purple-400 to-purple-500';
                                        return 'from-gray-400 to-gray-500';
                                      };
                                      
                                      const getBadgeText = () => {
                                        if (variable.nodeType === 'user-input') return 'Ввод';
                                        if (variable.nodeType === 'start') return 'Команда';
                                        if (variable.nodeType === 'command') return 'Команда';
                                        if (variable.nodeType === 'system') return 'Система';
                                        if (variable.nodeType === 'conditional') return 'Условие';
                                        return 'Другое';
                                      };
                                      
                                      return (
                                        <DropdownMenuItem
                                          key={`${variable.nodeId}-${variable.name}-${index}`}
                                          onClick={() => {
                                            const currentText = button.text || '';
                                            const newText = currentText + `{${variable.name}}`;
                                            onButtonUpdate(selectedNode.id, button.id, { text: newText });
                                          }}
                                          className="cursor-pointer p-0 m-0 h-auto"
                                        >
                                          <div className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all duration-150 border border-transparent hover:border-purple-300/40 dark:hover:border-purple-700/40 group flex items-start gap-2 sm:gap-3">
                                            <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${getColor()} text-white group-hover:shadow-md transition-all`}>
                                              <i className={`fas ${getIcon()} text-xs sm:text-sm`}></i>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <code className="text-xs sm:text-sm font-mono font-bold bg-white/60 dark:bg-slate-800/60 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-purple-700 dark:text-purple-300 group-hover:bg-white/80 dark:group-hover:bg-slate-700/80 transition-all">
                                                  {`{${variable.name}}`}
                                                </code>
                                                <Badge variant="secondary" className={`text-xs h-5 text-xs font-semibold bg-white/70 dark:bg-slate-800/70 text-purple-700 dark:text-purple-300 border border-purple-300/30 dark:border-purple-700/30`}>
                                                  {getBadgeText()}
                                                </Badge>
                                              </div>
                                              {variable.description && (
                                                <div className="text-xs text-purple-600/80 dark:text-purple-300/60 mt-1 leading-tight">
                                                  {variable.description}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="px-3 sm:px-4 py-4 sm:py-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-purple-100/50 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                                      <i className="fas fa-inbox text-purple-400 dark:text-purple-500"></i>
                                    </div>
                                    <div className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                                      Нет переменных
                                    </div>
                                    <div className="text-xs text-purple-600/70 dark:text-purple-400/60 leading-relaxed">
                                      Добавьте узлы для получения переменных
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Divider */}
                      <div className="border-t border-border/20 my-3"></div>

                      {/* Button Type Selection - Show for Multiple Selection Mode */}
                      {selectedNode.data.allowMultipleSelection && (
                        <div className="mb-3">
                          <Label className="text-xs font-medium text-muted-foreground mb-2 block">Тип кнопки</Label>
                          <Select
                            value={button.buttonType || 'normal'}
                            onValueChange={(value: 'normal' | 'option' | 'complete') => {
                              if (value === 'option') {
                                onButtonUpdate(selectedNode.id, button.id, { 
                                  buttonType: 'option', 
                                  action: 'selection', 
                                  target: '' 
                                });
                              } else if (value === 'complete') {
                                onButtonUpdate(selectedNode.id, button.id, { 
                                  buttonType: 'complete', 
                                  action: 'goto', 
                                  target: selectedNode.data.continueButtonTarget || '' 
                                });
                              } else {
                                onButtonUpdate(selectedNode.id, button.id, { 
                                  buttonType: 'normal', 
                                  action: 'goto', 
                                  target: '' 
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-full text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <span>Обычная кнопка</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="option">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <span>Опция для выбора</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="complete">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                  <span>Кнопка завершения</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {/* Action Selection - Show for normal buttons or non-multiple-selection modes */}
                      {(!selectedNode.data.allowMultipleSelection || (button.buttonType !== 'option' && button.buttonType !== 'complete')) && (
                        <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-teal-50/40 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 border border-teal-200/40 dark:border-teal-800/30 hover:border-teal-300/60 dark:hover:border-teal-700/60 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 transition-all duration-200 group">
                          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                            <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-200/50 dark:bg-teal-900/40 group-hover:bg-teal-300/50 dark:group-hover:bg-teal-800/50 transition-all">
                              <i className="fas fa-arrow-right text-xs sm:text-sm text-teal-600 dark:text-teal-400"></i>
                            </div>
                            <div className="min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-100 cursor-pointer block">
                                Действие
                              </Label>
                              <div className="text-xs text-teal-700/70 dark:text-teal-300/70 mt-0.5 leading-snug hidden sm:block">
                                Что должна сделать кнопка при нажатии
                              </div>
                            </div>
                          </div>
                          <Select
                            value={button.action}
                            onValueChange={(value: 'goto' | 'command' | 'url' | 'selection') =>
                              onButtonUpdate(selectedNode.id, button.id, { action: value })
                            }
                          >
                            <SelectTrigger className="w-full text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-teal-300/40 dark:border-teal-700/40 hover:border-teal-400/60 dark:hover:border-teal-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-teal-500 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 dark:focus:ring-teal-600/30 transition-all duration-200 rounded-lg text-teal-900 dark:text-teal-50">
                              <SelectValue placeholder="Выберите действие" />
                            </SelectTrigger>
                            <SelectContent className="bg-gradient-to-br from-teal-50/95 to-cyan-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-teal-200/50 dark:border-teal-800/50 shadow-xl">
                              <SelectItem value="goto">
                                <div className="flex items-center gap-2">
                                  <i className="fas fa-right-long text-teal-600 dark:text-teal-400 text-xs"></i>
                                  <span>Перейти к экрану</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="command">
                                <div className="flex items-center gap-2">
                                  <i className="fas fa-terminal text-orange-600 dark:text-orange-400 text-xs"></i>
                                  <span>Выполнить команду</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="url">
                                <div className="flex items-center gap-2">
                                  <i className="fas fa-link text-blue-600 dark:text-blue-400 text-xs"></i>
                                  <span>Открыть ссылку</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="selection">
                                <div className="flex items-center gap-2">
                                  <i className="fas fa-check-square text-green-600 dark:text-green-400 text-xs"></i>
                                  <span>Выбор опции</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Skip Data Collection Toggle - Only show when collectUserInput is enabled */}
                      {selectedNode.data.collectUserInput && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-200 mt-3">
                          <div className="flex-1">
                            <Label className="text-xs font-medium text-foreground">
                              Не сохранять ответы
                            </Label>
                            <div className="text-xs text-muted-foreground mt-1">
                              Кнопка будет работать только для навигации, без сбора данных пользователя
                            </div>
                          </div>
                          <div className="ml-4">
                            <Switch
                              checked={button.skipDataCollection ?? false}
                              onCheckedChange={(checked) => 
                                onButtonUpdate(selectedNode.id, button.id, { skipDataCollection: checked })
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* Hide After Click Toggle - For reply buttons */}
                      {selectedNode.data.keyboardType === 'reply' && (
                        <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-red-50/40 to-rose-50/30 dark:from-red-950/20 dark:to-rose-950/10 border border-red-200/40 dark:border-red-800/30 hover:border-red-300/60 dark:hover:border-red-700/60 hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-all duration-200 group">
                          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-between">
                            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                              <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-200/50 dark:bg-red-900/40 group-hover:bg-red-300/50 dark:group-hover:bg-red-800/50 transition-all">
                                <i className="fas fa-eye-slash text-xs sm:text-sm text-red-600 dark:text-red-400"></i>
                              </div>
                              <div className="min-w-0 flex-1">
                                <Label className="text-xs sm:text-sm font-semibold text-red-900 dark:text-red-100 cursor-pointer block">
                                  Скрыть после использования
                                </Label>
                                <div className="text-xs text-red-700/70 dark:text-red-300/70 mt-0.5 leading-snug hidden sm:block">
                                  Сообщение будет удалено после нажатия кнопки
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <Switch
                                checked={button.hideAfterClick ?? false}
                                onCheckedChange={(checked) => 
                                  onButtonUpdate(selectedNode.id, button.id, { hideAfterClick: checked })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Button Type Info Blocks */}
                      {selectedNode.data.allowMultipleSelection && (
                        <>
                          {/* Option Button Info */}
                          {button.buttonType === 'option' && (
                            <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200/40 dark:border-green-800/40 rounded-lg p-2 mt-2 space-y-2">
                              <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                                Опция для выбора
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                {selectedNode.data.keyboardType === 'inline' 
                                  ? `При нажатии появится отметка ${selectedNode.data.checkmarkSymbol || '✅'}`
                                  : 'После выбора покажется обновленная клавиатура'
                                }
                              </div>
                              
                              {/* Checkmark Symbol Input */}
                              {selectedNode.data.keyboardType === 'inline' && (
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-green-700 dark:text-green-300">Символ отметки</Label>
                                  <Input
                                    value={selectedNode.data.checkmarkSymbol || '✅'}
                                    onChange={(e) => onNodeUpdate(selectedNode.id, { checkmarkSymbol: e.target.value })}
                                    className="text-xs bg-white dark:bg-green-950/30 border-green-300 dark:border-green-700"
                                    placeholder="✅"
                                    maxLength={3}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Complete Button Info */}
                          {button.buttonType === 'complete' && (
                            <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/40 dark:border-purple-800/40 rounded-lg p-2 mt-2">
                              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                                Кнопка завершения
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                Сохраняет выбранные опции и переходит к следующему экрану
                              </div>
                            </div>
                          )}
                          
                          {/* Normal Button Info */}
                          {button.buttonType === 'normal' && (
                            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/40 rounded-lg p-2 mt-2">
                              <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                Обычная кнопка
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Работает как обычная кнопка навигации или команда
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {(!selectedNode.data.allowMultipleSelection || button.action !== 'selection') && button.action === 'url' && (
                        <Input
                          value={button.url || ''}
                          onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { url: e.target.value })}
                          className="mt-2 text-xs"
                          placeholder="https://example.com"
                        />
                      )}
                      
                      {(!selectedNode.data.allowMultipleSelection || button.action !== 'selection') && button.action === 'command' && (
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
                            <div className="flex items-center text-xs text-warning-foreground bg-warning/10 dark:bg-warning/5 border border-warning/20 dark:border-warning/10 p-2 rounded-md">
                              <svg className="w-3 h-3 mr-2 text-warning" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span>Команда должна начинаться с символа "/"</span>
                            </div>
                          )}
                        </div>
                      )}

                      {(!selectedNode.data.allowMultipleSelection || button.action !== 'selection') && button.action === 'goto' && (
                        <div className="mt-2 space-y-2">
                          <Select
                            value={button.target || ''}
                            onValueChange={(value) => onButtonUpdate(selectedNode.id, button.id, { target: value })}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Выберите экран" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAllNodesFromAllSheets
                                .filter(n => n.node.id !== selectedNode.id)
                                .map(({node, sheetName}) => {
                                  const nodeContent = 
                                    node.type === 'start' ? node.data.command :
                                    node.type === 'command' ? node.data.command :
                                    node.type === 'message' ? ((node.data as any).messageText || '').slice(0, 50) :
                                    node.type === 'photo' ? ((node.data as any).photoCaption || '').slice(0, 50) :
                                    node.type === 'keyboard' ? ((node.data as any).keyboardText || '').slice(0, 50) :
                                    '';
                                  
                                  return (
                                    <SelectItem key={node.id} value={node.id}>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{node.type}</span>
                                        <span className="text-xs font-mono text-muted-foreground">{node.id}</span>
                                        <span>{nodeContent}</span>
                                        <span className="text-xs text-blue-600 dark:text-blue-400">({sheetName})</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              {getAllNodesFromAllSheets.filter(n => n.node.id !== selectedNode.id).length === 0 && (
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
        )}

        {/* Conditional Messages - скрыто для узлов управления */}
        {(selectedNode.type === 'start' || selectedNode.type === 'command' || selectedNode.type === 'message') && 
         selectedNode.type !== 'pin_message' && 
         selectedNode.type !== 'unpin_message' && 
         selectedNode.type !== 'delete_message' &&
         selectedNode.type !== 'ban_user' && 
         selectedNode.type !== 'unban_user' && 
         selectedNode.type !== 'mute_user' && 
         selectedNode.type !== 'unmute_user' && 
         selectedNode.type !== 'kick_user' && 
         selectedNode.type !== 'promote_user' && 
         selectedNode.type !== 'demote_user' && 
         selectedNode.type !== 'admin_rights' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">🔄 Условные сообщения</h3>
              <Switch
                checked={selectedNode.data.enableConditionalMessages ?? false}
                onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { enableConditionalMessages: checked })}
              />
            </div>
            <div className="space-y-4">

              {/* Conditional Messages Settings */}
              {selectedNode.data.enableConditionalMessages && (
                <div className="space-y-4 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10 border border-purple-200/30 dark:border-purple-800/30 rounded-lg p-4">
                  
                  {/* Information Block */}
                  <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/40 dark:border-blue-800/40 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className="fas fa-info text-white text-xs"></i>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Как это работает?
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                          <div className="space-y-1">
                            <div>📝 Бот запомнит ответы пользователей на вопросы</div>
                            <div>🎯 Покажет разные сообщения в зависимости от этих ответов</div>
                            <div>⚡ Например: новым - "Добро пожаловать!", старым - "С возвращением!"</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conditional Messages List */}
                  <div>
                    <div className="space-y-2 mb-4">
                      <Label className="text-sm font-semibold text-purple-700 dark:text-purple-300 block">
                        📋 Настройка условий для показа сообщений
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        <UIButton
                          size="sm"
                          variant="outline"
                          onClick={autoFixPriorities}
                          className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200"
                          title="Автоматически расставить приоритеты для избежания конфликтов"
                        >
                          <i className="fas fa-sort-amount-down mr-1.5"></i>
                          Приоритеты
                        </UIButton>
                        <UIButton
                          size="sm"
                          variant="default"
                          onClick={() => {
                            const currentConditions = selectedNode.data.conditionalMessages || [];
                            const nextPriority = Math.max(0, ...currentConditions.map(c => c.priority || 0)) + 10;
                            
                            const newCondition = {
                              id: `condition-${Date.now()}`,
                              condition: 'user_data_exists' as const,
                              variableName: '',
                              variableNames: [],
                              logicOperator: 'AND' as const,
                              messageText: 'Добро пожаловать обратно!',
                              formatMode: 'text' as const,
                              keyboardType: 'none' as const,
                              buttons: [],
                              waitForTextInput: false,
                              priority: nextPriority
                            };
                            onNodeUpdate(selectedNode.id, { 
                              conditionalMessages: [...currentConditions, newCondition] 
                            });
                          }}
                          className="text-xs bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 transition-all duration-200"
                        >
                          <i className="fas fa-plus mr-1.5"></i>
                          Добавить условие
                        </UIButton>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(selectedNode.data.conditionalMessages || [])
                        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                        .map((condition, index) => {
                          // Check if this rule has conflicts
                          const ruleConflicts = detectRuleConflicts.filter(c => c.ruleIndex === index);
                          const hasErrors = ruleConflicts.some(c => c.severity === 'error');
                          const hasWarnings = ruleConflicts.some(c => c.severity === 'warning');
                          
                          return (
                            <div key={condition.id} className={`border rounded-xl transition-all duration-200 ${
                              hasErrors 
                                ? 'border-red-400/50 dark:border-red-600/50 bg-gradient-to-br from-red-50/40 to-pink-50/40 dark:from-red-950/30 dark:to-pink-950/20' 
                                : hasWarnings 
                                  ? 'border-yellow-400/40 dark:border-yellow-600/40 bg-gradient-to-br from-yellow-50/30 to-amber-50/30 dark:from-yellow-950/25 dark:to-amber-950/20'
                                  : 'border-purple-300/30 dark:border-purple-700/30 bg-gradient-to-br from-purple-50/20 to-indigo-50/20 dark:from-purple-950/15 dark:to-indigo-950/15'
                            }`}>
                              {/* Header with Title, Status, Priority and Controls */}
                              <div className="px-4 py-3 border-b border-white/40 dark:border-slate-800/40">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className="text-sm font-bold text-purple-700 dark:text-purple-300 flex-shrink-0">
                                      ⚙️ Условие #{index + 1}
                                    </div>
                                    {hasErrors && (
                                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0" title="Ошибка в условии">
                                        <i className="fas fa-times text-white text-xs"></i>
                                      </div>
                                    )}
                                    {hasWarnings && !hasErrors && (
                                      <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0" title="Предупреждение">
                                        <i className="fas fa-exclamation text-white text-xs"></i>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap justify-end">
                                    <div className="flex items-center gap-1 bg-purple-200/30 dark:bg-purple-800/30 px-2 py-1 rounded-lg border border-purple-300/40 dark:border-purple-700/40 flex-shrink-0">
                                      <i className="fas fa-fire text-purple-600 dark:text-purple-400 text-xs"></i>
                                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">{condition.priority || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 bg-blue-100/40 dark:bg-blue-900/30 rounded-lg p-0.5 border border-blue-300/30 dark:border-blue-700/30 flex-shrink-0">
                                      <UIButton size="sm" variant="ghost" onClick={() => {const currentConditions = selectedNode.data.conditionalMessages || [];const updatedConditions = currentConditions.map(c => c.id === condition.id ? { ...c, priority: (c.priority || 0) + 10 } : c);onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });}} className="h-7 w-7 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-200/50 dark:hover:bg-blue-700/50 rounded transition-all" title="Повысить (+10)"><i className="fas fa-chevron-up text-xs"></i></UIButton>
                                      <UIButton size="sm" variant="ghost" onClick={() => {const currentConditions = selectedNode.data.conditionalMessages || [];const updatedConditions = currentConditions.map(c => c.id === condition.id ? { ...c, priority: Math.max(0, (c.priority || 0) - 10) } : c);onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });}} className="h-7 w-7 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-200/50 dark:hover:bg-blue-700/50 rounded transition-all" title="Понизить (-10)"><i className="fas fa-chevron-down text-xs"></i></UIButton>
                                      <div className="w-px h-3 bg-blue-300/30 dark:bg-blue-700/30"></div>
                                      <UIButton size="sm" variant="ghost" onClick={() => {const currentConditions = selectedNode.data.conditionalMessages || [];const newConditions = currentConditions.filter(c => c.id !== condition.id);onNodeUpdate(selectedNode.id, { conditionalMessages: newConditions });}} className="h-7 w-7 p-0 text-red-600 dark:text-red-400 hover:bg-red-200/50 dark:hover:bg-red-700/50 rounded transition-all" title="Удалить"><i className="fas fa-trash text-xs"></i></UIButton>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Show conflicts for this rule */}
                              {ruleConflicts.length > 0 && (
                                <div className="px-4 py-2 bg-red-50/60 dark:bg-red-950/40 border-b border-red-200/40 dark:border-red-800/40">
                                  <div className="space-y-1">
                                    {ruleConflicts.map((conflict, idx) => (
                                      <div key={idx} className="text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                                        <i className={`fas ${conflict.severity === 'error' ? 'fa-times-circle' : 'fa-exclamation-triangle'} mt-0.5 flex-shrink-0`}></i>
                                        <span>{conflict.description}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Main Content */}
                              <div className="px-4 py-3 space-y-4">
                            {/* Condition Type */}
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Тип условия
                              </Label>
                              <Select
                                value={condition.condition}
                                onValueChange={(value) => {
                                  const currentConditions = selectedNode.data.conditionalMessages || [];
                                  const updatedConditions = currentConditions.map(c => 
                                    c.id === condition.id ? { ...c, condition: value as any } : c
                                  );
                                  onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                }}
                              >
                                <SelectTrigger className="text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user_data_exists">Пользователь уже отвечал на вопрос</SelectItem>
                                  <SelectItem value="user_data_not_exists">Пользователь НЕ отвечал на вопрос</SelectItem>
                                  <SelectItem value="user_data_equals">Ответ пользователя равен определенному значению</SelectItem>
                                  <SelectItem value="user_data_contains">Ответ пользователя содержит определенный текст</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Variable Names - Multiple Question Selection */}
                            {(condition.condition === 'user_data_exists' || 
                              condition.condition === 'user_data_not_exists' || 
                              condition.condition === 'user_data_equals' || 
                              condition.condition === 'user_data_contains') && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                                  На какие вопросы должен был ответить пользователь?
                                </Label>
                                
                                {/* Multiple Question Selection with Checkboxes */}
                                {availableQuestions.length > 0 ? (
                                  <div className="space-y-3">
                                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                      <div className="text-xs font-medium text-muted-foreground mb-2">
                                        Выберите вопросы из списка:
                                      </div>
                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {availableQuestions.map((question) => {
                                          const currentVariableNames = condition.variableNames || [];
                                          const isSelected = currentVariableNames.includes(question.name);
                                          
                                          return (
                                            <div key={`${question.nodeId}-${question.name}`} className="flex items-center space-x-2">
                                              <input
                                                type="checkbox"
                                                id={`question-${condition.id}-${question.name}`}
                                                checked={isSelected}
                                                onChange={(e) => {
                                                  const currentConditions = selectedNode.data.conditionalMessages || [];
                                                  const currentVariableNames = condition.variableNames || [];
                                                  
                                                  let updatedVariableNames;
                                                  if (e.target.checked) {
                                                    updatedVariableNames = [...currentVariableNames, question.name];
                                                  } else {
                                                    updatedVariableNames = currentVariableNames.filter(name => name !== question.name);
                                                  }
                                                  
                                                  const updatedConditions = currentConditions.map(c => 
                                                    c.id === condition.id ? { 
                                                      ...c, 
                                                      variableNames: updatedVariableNames,
                                                      // Update legacy variableName for backward compatibility
                                                      variableName: updatedVariableNames.length > 0 ? updatedVariableNames[0] : ''
                                                    } : c
                                                  );
                                                  onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                                }}
                                                className="w-3 h-3 text-primary focus:ring-primary border-border rounded"
                                              />
                                              <label 
                                                htmlFor={`question-${condition.id}-${question.name}`}
                                                className="flex items-center space-x-2 cursor-pointer flex-1"
                                              >
                                                {question.mediaType ? (
                                                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    {question.mediaType === 'photo' && '📷'}
                                                    {question.mediaType === 'video' && '🎥'}
                                                    {question.mediaType === 'audio' && '🎵'}
                                                    {question.mediaType === 'document' && '📄'}
                                                    {question.mediaType}
                                                  </span>
                                                ) : (
                                                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                                    {question.nodeType}
                                                  </span>
                                                )}
                                                <span className="text-xs">{question.name}</span>
                                              </label>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    
                                    {/* Logic Operator Selection for Multiple Questions */}
                                    {(condition.variableNames?.length || 0) > 1 && (
                                      <div>
                                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                          Логика проверки нескольких вопросов:
                                        </Label>
                                        <Select
                                          value={condition.logicOperator || 'AND'}
                                          onValueChange={(value: 'AND' | 'OR') => {
                                            const currentConditions = selectedNode.data.conditionalMessages || [];
                                            const updatedConditions = currentConditions.map(c => 
                                              c.id === condition.id ? { ...c, logicOperator: value } : c
                                            );
                                            onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                          }}
                                        >
                                          <SelectTrigger className="text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="AND">И (AND) - все выбранные вопросы</SelectItem>
                                            <SelectItem value="OR">ИЛИ (OR) - любой из выбранных вопросов</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {condition.logicOperator === 'AND' 
                                            ? 'Пользователь должен ответить на ВСЕ выбранные вопросы'
                                            : 'Пользователь должен ответить на ЛЮБОЙ из выбранных вопросов'
                                          }
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Manual Input for Additional Questions */}
                                    <div>
                                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                        Или добавьте вопросы вручную:
                                      </Label>
                                      <Input
                                        value={(condition.variableNames || []).join(', ')}
                                        onChange={(e) => {
                                          const currentConditions = selectedNode.data.conditionalMessages || [];
                                          const variableNames = e.target.value.split(',').map(name => name.trim()).filter(name => name);
                                          const updatedConditions = currentConditions.map(c => 
                                            c.id === condition.id ? { 
                                              ...c, 
                                              variableNames: variableNames,
                                              variableName: variableNames.length > 0 ? variableNames[0] : ''
                                            } : c
                                          );
                                          onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                        }}
                                        className="text-xs"
                                        placeholder="имя, пол, возраст (через запятую)"
                                      />
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Введите названия вопросов через запятую
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-muted-foreground bg-muted/30 rounded-lg border border-border/50">
                                    <i className="fas fa-question-circle text-lg mb-2"></i>
                                    <div className="text-xs">
                                      Нет доступных вопросов. Создайте узлы с пользовательским вводом.
                                    </div>
                                  </div>
                                )}
                                
                                {/* Display Selected Questions */}
                                {(condition.variableNames?.length || 0) > 0 && (
                                  <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200/40 dark:border-green-800/40 rounded-lg p-2">
                                    <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                                      Выбранные вопросы ({condition.variableNames?.length || 0}):
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {(condition.variableNames || []).map((name, idx) => (
                                        <span key={idx} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                                          {name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Expected Value */}
                            {(condition.condition === 'user_data_equals' || 
                              condition.condition === 'user_data_contains') && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                  {condition.condition === 'user_data_equals' 
                                    ? 'Какой должен быть точный ответ пользователя?' 
                                    : 'Какой текст должен содержаться в ответе?'}
                                </Label>
                                <Input
                                  value={condition.expectedValue || ''}
                                  onChange={(e) => {
                                    const currentConditions = selectedNode.data.conditionalMessages || [];
                                    const updatedConditions = currentConditions.map(c => 
                                      c.id === condition.id ? { ...c, expectedValue: e.target.value } : c
                                    );
                                    onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                  }}
                                  className="text-xs"
                                  placeholder={condition.condition === 'user_data_equals' ? 'Реклама' : 'рекл'}
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                  {condition.condition === 'user_data_equals' 
                                    ? 'Например: "Реклама", "Мужской", "25"' 
                                    : 'Например: "рекл" найдет "Реклама", "реклама в интернете"'}
                                </div>
                              </div>
                            )}



                            {/* Message Text with Formatting */}
                            <div className="border border-green-200/50 dark:border-green-800/50 rounded-lg p-3 bg-green-50/30 dark:bg-green-950/20">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs font-medium text-green-700 dark:text-green-300">
                                  Что показать пользователю, если условие выполнится?
                                </Label>
                                <Switch
                                  checked={(condition as any).showCustomMessage ?? false}
                                  onCheckedChange={(checked) => {
                                    const currentConditions = selectedNode.data.conditionalMessages || [];
                                    const updatedConditions = currentConditions.map(c => 
                                      c.id === condition.id ? { ...c, showCustomMessage: checked } as any : c
                                    );
                                    onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                  }}
                                />
                              </div>
                              {(condition as any).showCustomMessage && (
                                <div className="space-y-2">
                                  {/* Rich Text Editor for conditional message */}
                                  <InlineRichEditor
                                    value={condition.messageText}
                                    onChange={(value) => {
                                      const currentConditions = selectedNode.data.conditionalMessages || [];
                                      const updatedConditions = currentConditions.map(c => 
                                        c.id === condition.id ? { ...c, messageText: value } : c
                                      );
                                      onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                    }}
                                    placeholder="Добро пожаловать обратно! Рады вас снова видеть."
                                    enableMarkdown={condition.formatMode === 'markdown'}
                                    onMarkdownToggle={(enabled) => {
                                      const currentConditions = selectedNode.data.conditionalMessages || [];
                                      const updatedConditions = currentConditions.map(c => 
                                        c.id === condition.id ? { ...c, formatMode: (enabled ? 'markdown' : 'text') as 'text' | 'markdown' | 'html' } : c
                                      );
                                      onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                    }}
                                    availableVariables={textVariables}
                                  />
                                  
                                  <div className="text-xs text-green-600 dark:text-green-400">
                                    Если не указано, будет использоваться основной текст узла
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Text Input Configuration */}
                            <div className="border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-3 bg-blue-50/30 dark:bg-blue-950/20">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center">
                                  <i className="fas fa-keyboard mr-1"></i>
                                  Ожидание текстового ввода
                                </Label>
                                <Switch
                                  checked={condition.waitForTextInput ?? false}
                                  onCheckedChange={(checked) => {
                                    const currentConditions = selectedNode.data.conditionalMessages || [];
                                    const updatedConditions = currentConditions.map(c => 
                                      c.id === condition.id ? { ...c, waitForTextInput: checked } : c
                                    );
                                    onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                  }}
                                />
                              </div>
                              {condition.waitForTextInput && (
                                <div className="space-y-2">
                                  <div className="text-xs text-blue-600 dark:text-blue-400">
                                    После показа этого сообщения бот будет ждать текстовый ответ от пользователя
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                      Переменная для сохранения ответа (необязательно)
                                    </Label>
                                    <Input
                                      value={condition.textInputVariable || ''}
                                      onChange={(e) => {
                                        const currentConditions = selectedNode.data.conditionalMessages || [];
                                        const updatedConditions = currentConditions.map(c => 
                                          c.id === condition.id ? { ...c, textInputVariable: e.target.value } : c
                                        );
                                        onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                      }}
                                      className="text-xs"
                                      placeholder="conditional_answer"
                                    />
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Если не указать, будет использовано автоматическое имя переменной
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                                      Куда перейти после ответа
                                    </Label>
                                    <div className="space-y-2">
                                      <Select
                                        value={condition.nextNodeAfterInput || 'no-transition'}
                                        onValueChange={(value) => {
                                          const currentConditions = selectedNode.data.conditionalMessages || [];
                                          const updatedConditions = currentConditions.map(c => 
                                            c.id === condition.id ? { ...c, nextNodeAfterInput: value === 'no-transition' ? undefined : value } : c
                                          );
                                          onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                        }}
                                      >
                                        <SelectTrigger className="text-xs h-8">
                                          <SelectValue placeholder="Выберите следующий шаг" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="no-transition">Не переходить</SelectItem>
                                          {getAllNodesFromAllSheets.filter(n => n.node.id !== selectedNode.id).map(({node, sheetName}) => {
                                            const nodeContent = 
                                              node.type === 'command' ? node.data.command :
                                              node.type === 'message' ? ((node.data as any).messageText || '').slice(0, 50) :
                                              node.type === 'photo' ? ((node.data as any).photoCaption || '').slice(0, 50) :
                                              node.type === 'keyboard' ? ((node.data as any).keyboardText || '').slice(0, 50) :
                                              ((node.data as any).label || '').slice(0, 50);
                                            return (
                                              <SelectItem key={node.id} value={node.id}>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs text-muted-foreground">{node.type}</span>
                                                  <span className="text-xs font-mono text-muted-foreground">{node.id}</span>
                                                  <span>{nodeContent}</span>
                                                  <span className="text-xs text-blue-600 dark:text-blue-400">({sheetName})</span>
                                                </div>
                                              </SelectItem>
                                            );
                                          })}
                                        </SelectContent>
                                      </Select>
                                      
                                      <div className="text-xs text-muted-foreground mb-1">
                                        Или введите ID узла вручную (например: ylObKToWFsIl-opIcowPZ)
                                      </div>
                                      <Input
                                        value={condition.nextNodeAfterInput && condition.nextNodeAfterInput !== 'no-transition' ? condition.nextNodeAfterInput : ''}
                                        onChange={(e) => {
                                          const currentConditions = selectedNode.data.conditionalMessages || [];
                                          const updatedConditions = currentConditions.map(c => 
                                            c.id === condition.id ? { ...c, nextNodeAfterInput: e.target.value || undefined } : c
                                          );
                                          onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                        }}
                                        className="text-xs h-8"
                                        placeholder="Введите ID узла вручную"
                                      />
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">
                                      Узел, к которому перейти после получения ответа пользователя
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Keyboard Configuration for Conditional Messages */}
                            <div className="space-y-3 border-t border-purple-200/30 dark:border-purple-800/30 pt-4">
                              <div className="flex flex-col gap-3">
                                <Label className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                                  <i className="fas fa-keyboard mr-1.5"></i>
                                  Кнопки для условного сообщения
                                </Label>
                                <div className="flex flex-wrap items-center gap-2 bg-purple-100/30 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-200/40 dark:border-purple-800/40">
                                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-purple-200/40 dark:hover:bg-purple-800/40 transition-all cursor-pointer">
                                    <i className="fas fa-square text-purple-600 dark:text-purple-400 text-xs"></i>
                                    <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 cursor-pointer">Inline</Label>
                                    <Switch
                                      checked={(condition as any).keyboardType === 'inline'}
                                      onCheckedChange={(checked) => {
                                        const currentConditions = selectedNode.data.conditionalMessages || [];
                                        const updatedConditions = currentConditions.map(c => 
                                          c.id === condition.id ? { ...c, keyboardType: checked ? 'inline' : 'none' } as any : c
                                        );
                                        onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                      }}
                                    />
                                  </div>
                                  <div className="w-px h-5 bg-purple-300/30 dark:bg-purple-700/30"></div>
                                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-purple-200/40 dark:hover:bg-purple-800/40 transition-all cursor-pointer">
                                    <i className="fas fa-bars text-purple-600 dark:text-purple-400 text-xs"></i>
                                    <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 cursor-pointer">Reply</Label>
                                    <Switch
                                      checked={(condition as any).keyboardType === 'reply'}
                                      onCheckedChange={(checked) => {
                                        const currentConditions = selectedNode.data.conditionalMessages || [];
                                        const updatedConditions = currentConditions.map(c => 
                                          c.id === condition.id ? { ...c, keyboardType: checked ? 'reply' : 'none' } as any : c
                                        );
                                        onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Buttons Configuration */}
                              {condition.keyboardType && condition.keyboardType !== 'none' && (
                                <div className="space-y-4">
                                  <div className="border-t border-purple-200/20 dark:border-purple-800/20 pt-4"></div>
                                  
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide truncate">
                                        Кнопки ({(condition.buttons || []).length})
                                      </span>
                                    </div>
                                    <UIButton
                                      size="sm"
                                      variant="default"
                                      onClick={() => {
                                        const newButton = {
                                          id: nanoid(),
                                          text: 'Новая кнопка',
                                          action: 'goto' as const,
                                          target: '',
                                          url: '',
                                          buttonType: 'normal' as const,
                                          skipDataCollection: false,
                                          hideAfterClick: false
                                        };
                                        const currentConditions = selectedNode.data.conditionalMessages || [];
                                        const updatedConditions = currentConditions.map(c => 
                                          c.id === condition.id ? { 
                                            ...c, 
                                            buttons: [...(c.buttons || []), newButton] 
                                          } : c
                                        );
                                        onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                      }}
                                      title="Добавить кнопку"
                                      className="text-xs bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 transition-all duration-200 h-8 flex-shrink-0"
                                    >
                                      <i className="fas fa-plus"></i>
                                      <span className="hidden sm:inline ml-1.5">Добавить кнопку</span>
                                    </UIButton>
                                  </div>

                                  {/* Buttons List */}
                                  <div className="space-y-2.5">
                                    {(condition.buttons || []).map((button, buttonIndex) => (
                                      <div key={button.id} className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-purple-200/50 dark:border-purple-800/50 shadow-sm hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200">
                                        <div className="space-y-2.5">
                                          {/* Button Header */}
                                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-purple-100/30 dark:border-purple-800/20">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div className="w-1 h-1 rounded-full bg-purple-500 flex-shrink-0"></div>
                                              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 truncate">
                                                Кнопка {buttonIndex + 1}
                                              </span>
                                            </div>
                                            <UIButton
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                const currentConditions = selectedNode.data.conditionalMessages || [];
                                                const updatedConditions = currentConditions.map(c => 
                                                  c.id === condition.id ? {
                                                    ...c,
                                                    buttons: (c.buttons || []).filter((_, i) => i !== buttonIndex)
                                                  } : c
                                                );
                                                onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                              }}
                                              className="h-6 text-destructive hover:text-destructive/80 flex-shrink-0"
                                              title="Удалить кнопку"
                                            >
                                              <i className="fas fa-trash text-xs"></i>
                                            </UIButton>
                                          </div>

                                          {/* Button Text Section */}
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                              <Label className="text-xs font-medium text-foreground">
                                                Текст
                                              </Label>
                                              <div className="flex items-center gap-1">
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <UIButton
                                                      size="sm"
                                                      variant="outline"
                                                      className="h-7 text-xs gap-1"
                                                      title="Вставить переменную"
                                                    >
                                                      <Plus className="h-3 w-3" />
                                                      <span className="hidden sm:inline">Переменная</span>
                                                    </UIButton>
                                                  </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuLabel className="text-xs">
                                                  Доступные переменные
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {textVariables.map((variable, index) => {
                                                  const getBadgeText = () => {
                                                    if (variable.nodeType === 'user-input') return 'Ввод';
                                                    if (variable.nodeType === 'start') return 'Команда';
                                                    if (variable.nodeType === 'command') return 'Команда';
                                                    if (variable.nodeType === 'system') return 'Система';
                                                    if (variable.nodeType === 'conditional') return 'Условие';
                                                    return 'Другое';
                                                  };
                                                  
                                                  return (
                                                    <DropdownMenuItem
                                                      key={`${variable.nodeId}-${variable.name}-${index}`}
                                                      onClick={() => {
                                                        const currentConditions = selectedNode.data.conditionalMessages || [];
                                                        const currentText = button.text || '';
                                                        const newText = currentText + `{${variable.name}}`;
                                                        const updatedConditions = currentConditions.map(c => 
                                                          c.id === condition.id ? {
                                                            ...c,
                                                            buttons: (c.buttons || []).map((b, i) => 
                                                              i === buttonIndex ? { ...b, text: newText } : b
                                                            )
                                                          } : c
                                                        );
                                                        onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                                      }}
                                                      className="cursor-pointer"
                                                    >
                                                      <div className="flex flex-col gap-1 w-full">
                                                        <div className="flex items-center gap-2">
                                                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                            {`{${variable.name}}`}
                                                          </code>
                                                          <Badge variant="outline" className="text-xs h-4">
                                                            {getBadgeText()}
                                                          </Badge>
                                                        </div>
                                                        {variable.description && (
                                                          <div className="text-xs text-muted-foreground">
                                                            {variable.description}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </DropdownMenuItem>
                                                  );
                                                })}
                                                {textVariables.length === 0 && (
                                                  <DropdownMenuItem disabled>
                                                    <span className="text-xs text-muted-foreground">
                                                      Нет доступных переменных
                                                    </span>
                                                  </DropdownMenuItem>
                                                )}
                                              </DropdownMenuContent>
                                                </DropdownMenu>
                                              </div>
                                            </div>
                                            <Input
                                              value={button.text}
                                              onChange={(e) => {
                                                const currentConditions = selectedNode.data.conditionalMessages || [];
                                                const updatedConditions = currentConditions.map(c => 
                                                  c.id === condition.id ? {
                                                    ...c,
                                                    buttons: (c.buttons || []).map((b, i) => 
                                                      i === buttonIndex ? { ...b, text: e.target.value } : b
                                                    )
                                                  } : c
                                                );
                                                onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                              }}
                                              className="h-9 text-sm"
                                              placeholder="Текст кнопки"
                                            />
                                            <div className="text-xs text-muted-foreground">
                                              {`Переменные: {age} → "25"`}
                                            </div>
                                          </div>

                                          {/* Button Action Configuration */}
                                          <div className="space-y-2 border-t border-purple-100/30 dark:border-purple-800/20 pt-2.5">
                                            <Label className="text-xs font-medium text-foreground">
                                              Действие
                                            </Label>
                                            <Select
                                              value={button.action || 'goto'}
                                              onValueChange={(value: 'goto' | 'url' | 'command' | 'selection') => {
                                                const currentConditions = selectedNode.data.conditionalMessages || [];
                                                const updatedConditions = currentConditions.map(c => 
                                                  c.id === condition.id ? {
                                                    ...c,
                                                    buttons: (c.buttons || []).map((b, i) => 
                                                      i === buttonIndex ? { ...b, action: value } : b
                                                    )
                                                  } : c
                                                );
                                                onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                              }}
                                            >
                                              <SelectTrigger className="h-9 text-sm">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="goto">Перейти к узлу</SelectItem>
                                                <SelectItem value="url">Открыть ссылку</SelectItem>
                                                <SelectItem value="command">Выполнить команду</SelectItem>
                                                <SelectItem value="selection">Выбор опции</SelectItem>
                                              </SelectContent>
                                            </Select>

                                            {button.action === 'goto' && (
                                              <Select
                                                value={button.target || ''}
                                                onValueChange={(value) => {
                                                  const currentConditions = selectedNode.data.conditionalMessages || [];
                                                  const updatedConditions = currentConditions.map(c => 
                                                    c.id === condition.id ? {
                                                      ...c,
                                                      buttons: (c.buttons || []).map((b, i) => 
                                                        i === buttonIndex ? { ...b, target: value } : b
                                                      )
                                                    } : c
                                                  );
                                                  onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                                }}
                                              >
                                                <SelectTrigger className="h-9 text-sm">
                                                  <SelectValue placeholder="Выберите узел" />
                                                </SelectTrigger>
                                              <SelectContent>
                                                {getAllNodesFromAllSheets
                                                  .filter(n => n.node.id !== selectedNode.id)
                                                  .map(({node, sheetName}) => {
                                                    const nodeName = 
                                                      node.type === 'start' ? node.data.command :
                                                      node.type === 'command' ? node.data.command :
                                                      node.data.messageText?.slice(0, 30) + '...' || `${node.type} ${node.id}`;
                                                    return (
                                                      <SelectItem key={node.id} value={node.id}>
                                                        <div className="flex items-center gap-2">
                                                          <span>{nodeName}</span>
                                                          <span className="text-xs text-blue-600 dark:text-blue-400">({sheetName})</span>
                                                        </div>
                                                      </SelectItem>
                                                    );
                                                  })}
                                              </SelectContent>
                                            </Select>
                                          )}

                                            {button.action === 'url' && (
                                              <Input
                                                value={button.url || ''}
                                                onChange={(e) => {
                                                  const currentConditions = selectedNode.data.conditionalMessages || [];
                                                  const updatedConditions = currentConditions.map(c => 
                                                    c.id === condition.id ? {
                                                      ...c,
                                                      buttons: (c.buttons || []).map((b, i) => 
                                                        i === buttonIndex ? { ...b, url: e.target.value } : b
                                                      )
                                                    } : c
                                                  );
                                                  onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                                }}
                                                className="h-9 text-sm"
                                                placeholder="https://example.com"
                                              />
                                            )}

                                            {button.action === 'command' && (
                                              <Input
                                                value={button.target || ''}
                                                onChange={(e) => {
                                                  const currentConditions = selectedNode.data.conditionalMessages || [];
                                                  const updatedConditions = currentConditions.map(c => 
                                                    c.id === condition.id ? {
                                                      ...c,
                                                      buttons: (c.buttons || []).map((b, i) => 
                                                        i === buttonIndex ? { ...b, target: e.target.value } : b
                                                      )
                                                    } : c
                                                  );
                                                  onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                                }}
                                                className="h-9 text-sm"
                                                placeholder="/help"
                                              />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Reply Keyboard Settings */}
                                  {condition.keyboardType === 'reply' && (
                                    <div className="border-t border-purple-100/30 dark:border-purple-800/20 pt-2.5 space-y-2">
                                      <Label className="text-xs font-medium text-foreground block">Параметры</Label>
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs text-purple-700 dark:text-purple-400 cursor-pointer">Авто-размер</Label>
                                        <Switch
                                          checked={condition.resizeKeyboard ?? true}
                                          onCheckedChange={(checked) => {
                                            const currentConditions = selectedNode.data.conditionalMessages || [];
                                            const updatedConditions = currentConditions.map(c => 
                                              c.id === condition.id ? { ...c, resizeKeyboard: checked } : c
                                            );
                                            onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                          }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs text-purple-700 dark:text-purple-400 cursor-pointer">Скрыть после первого нажатия</Label>
                                        <Switch
                                          checked={condition.oneTimeKeyboard ?? false}
                                          onCheckedChange={(checked) => {
                                            const currentConditions = selectedNode.data.conditionalMessages || [];
                                            const updatedConditions = currentConditions.map(c => 
                                              c.id === condition.id ? { ...c, oneTimeKeyboard: checked } : c
                                            );
                                            onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                          );
                        }
                      )}

                      {(selectedNode.data.conditionalMessages || []).length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          <i className="fas fa-plus-circle text-2xl mb-2"></i>
                          <div className="text-xs">
                            Нажмите "Добавить условие" чтобы создать первое условное сообщение
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Universal User Input Collection - скрыто для узлов управления */}
        {selectedNode.type !== 'pin_message' && 
         selectedNode.type !== 'unpin_message' && 
         selectedNode.type !== 'delete_message' &&
         selectedNode.type !== 'ban_user' && 
         selectedNode.type !== 'unban_user' && 
         selectedNode.type !== 'mute_user' && 
         selectedNode.type !== 'unmute_user' && 
         selectedNode.type !== 'kick_user' && 
         selectedNode.type !== 'promote_user' && 
         selectedNode.type !== 'demote_user' && 
         selectedNode.type !== 'admin_rights' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">✨ Сбор ответов</h3>
              <Switch
                checked={selectedNode.data.collectUserInput ?? false}
                onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { collectUserInput: checked })}
              />
            </div>
            <div className="space-y-4">

              {/* Input Collection Settings */}
              {selectedNode.data.collectUserInput && (
                <div className="space-y-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200/30 dark:border-blue-800/30 rounded-lg p-4">
                  

                  
                  {/* Text Input Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-blue-200/30 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
                    <div className="flex-1">
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        <i className="fas fa-keyboard mr-1"></i>
                        Текстовый ввод
                      </Label>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Если выбран текстовый ввод, то как варианты ответа воспринимаются и кнопки и текстовой ввод
                      </div>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={selectedNode.data.enableTextInput ?? false}
                        onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { enableTextInput: checked })}
                      />
                    </div>
                  </div>

                  {/* Photo Input Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-blue-200/30 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
                    <div className="flex-1">
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        <i className="fas fa-image mr-1"></i>
                        Ввод фото
                      </Label>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Бот будет ожидать фото от пользователя и сохранит file_id в переменную
                      </div>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={selectedNode.data.enablePhotoInput ?? false}
                        onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { enablePhotoInput: checked })}
                      />
                    </div>
                  </div>

                  {selectedNode.data.enablePhotoInput && (
                    <div>
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                        <i className="fas fa-tag mr-1"></i>
                        Переменная для фото
                      </Label>
                      <Input
                        value={selectedNode.data.photoInputVariable || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { photoInputVariable: e.target.value })}
                        className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                        placeholder="user_photo"
                      />
                    </div>
                  )}

                  {/* Video Input Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-blue-200/30 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
                    <div className="flex-1">
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        <i className="fas fa-video mr-1"></i>
                        Ввод видео
                      </Label>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Бот будет ожидать видео от пользователя и сохранит file_id в переменную
                      </div>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={selectedNode.data.enableVideoInput ?? false}
                        onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { enableVideoInput: checked })}
                      />
                    </div>
                  </div>

                  {selectedNode.data.enableVideoInput && (
                    <div>
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                        <i className="fas fa-tag mr-1"></i>
                        Переменная для видео
                      </Label>
                      <Input
                        value={selectedNode.data.videoInputVariable || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { videoInputVariable: e.target.value })}
                        className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                        placeholder="user_video"
                      />
                    </div>
                  )}

                  {/* Audio Input Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-blue-200/30 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
                    <div className="flex-1">
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        <i className="fas fa-music mr-1"></i>
                        Ввод аудио
                      </Label>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Бот будет ожидать аудио от пользователя и сохранит file_id в переменную
                      </div>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={selectedNode.data.enableAudioInput ?? false}
                        onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { enableAudioInput: checked })}
                      />
                    </div>
                  </div>

                  {selectedNode.data.enableAudioInput && (
                    <div>
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                        <i className="fas fa-tag mr-1"></i>
                        Переменная для аудио
                      </Label>
                      <Input
                        value={selectedNode.data.audioInputVariable || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { audioInputVariable: e.target.value })}
                        className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                        placeholder="user_audio"
                      />
                    </div>
                  )}

                  {/* Document Input Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-blue-200/30 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
                    <div className="flex-1">
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        <i className="fas fa-file mr-1"></i>
                        Ввод документа
                      </Label>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Бот будет ожидать документ от пользователя и сохранит file_id в переменную
                      </div>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={selectedNode.data.enableDocumentInput ?? false}
                        onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { enableDocumentInput: checked })}
                      />
                    </div>
                  </div>

                  {selectedNode.data.enableDocumentInput && (
                    <div>
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                        <i className="fas fa-tag mr-1"></i>
                        Переменная для документа
                      </Label>
                      <Input
                        value={selectedNode.data.documentInputVariable || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { documentInputVariable: e.target.value })}
                        className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                        placeholder="user_document"
                      />
                    </div>
                  )}

                  {/* Button Type for button responses */}
                  {selectedNode.data.responseType === 'buttons' && (
                    <div>
                      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                        <i className="fas fa-mouse mr-1"></i>
                        Тип кнопок
                      </Label>
                      <Select
                        value={selectedNode.data.inputButtonType || 'inline'}
                        onValueChange={(value: 'inline' | 'reply') => onNodeUpdate(selectedNode.id, { inputButtonType: value })}
                      >
                        <SelectTrigger className="border-blue-200 dark:border-blue-700 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inline">Inline кнопки</SelectItem>
                          <SelectItem value="reply">Reply кнопки</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Response Options for buttons */}
                  {selectedNode.data.responseType === 'buttons' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          <i className="fas fa-list-ul mr-1"></i>
                          Варианты ответов
                        </Label>
                        <UIButton
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newOption = {
                              id: nanoid(),
                              text: 'Новый вариант',
                              value: '',
                              action: 'goto' as const,
                              target: ''
                            };
                            const updatedOptions = [...(selectedNode.data.responseOptions || []), newOption];
                            onNodeUpdate(selectedNode.id, { responseOptions: updatedOptions });
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        >
                          + Добавить
                        </UIButton>
                      </div>
                      
                      <div className="space-y-3">
                        {(selectedNode.data.responseOptions || []).map((option, index) => (
                          <div key={option.id} className="bg-card/50 rounded-lg p-3 border border-border/50">
                            <div className="flex items-center justify-between mb-2">
                              <Input
                                value={option.text}
                                onChange={(e) => {
                                  const updatedOptions = [...(selectedNode.data.responseOptions || [])];
                                  updatedOptions[index] = { ...option, text: e.target.value };
                                  onNodeUpdate(selectedNode.id, { responseOptions: updatedOptions });
                                }}
                                className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Текст кнопки"
                              />
                              <UIButton
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const updatedOptions = (selectedNode.data.responseOptions || []).filter((_, i) => i !== index);
                                  onNodeUpdate(selectedNode.id, { responseOptions: updatedOptions });
                                }}
                                className="text-muted-foreground hover:text-destructive h-auto p-1"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </UIButton>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 block">
                                  Значение для сохранения
                                </Label>
                                <Input
                                  value={option.value || ''}
                                  onChange={(e) => {
                                    const updatedOptions = [...(selectedNode.data.responseOptions || [])];
                                    updatedOptions[index] = { ...option, value: e.target.value };
                                    onNodeUpdate(selectedNode.id, { responseOptions: updatedOptions });
                                  }}
                                  className="text-xs border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                                  placeholder="Значение (если пусто - используется текст кнопки)"
                                />
                              </div>
                              
                              {/* Navigation settings for each button */}
                              <div>
                                <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 block">
                                  Действие кнопки
                                </Label>
                                <Select
                                  value={option.action || 'goto'}
                                  onValueChange={(value: any) => {
                                    const updatedOptions = [...(selectedNode.data.responseOptions || [])];
                                    updatedOptions[index] = { ...option, action: value };
                                    onNodeUpdate(selectedNode.id, { responseOptions: updatedOptions });
                                  }}
                                >
                                  <SelectTrigger className="text-xs border-blue-200 dark:border-blue-700 focus:border-blue-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="goto">
                                      <div className="flex items-center gap-2">
                                        <i className="fas fa-arrow-right text-xs text-blue-500"></i>
                                        <span>Перейти к экрану</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="command">
                                      <div className="flex items-center gap-2">
                                        <i className="fas fa-terminal text-xs text-purple-500"></i>
                                        <span>Выполнить команду</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="url">
                                      <div className="flex items-center gap-2">
                                        <i className="fas fa-external-link-alt text-xs text-green-500"></i>
                                        <span>Открыть ссылку</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="selection">
                                      <div className="flex items-center gap-2">
                                        <i className="fas fa-check-square text-xs text-purple-500"></i>
                                        <span>Выбор опции</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Target selection based on action type */}
                              {option.action === 'goto' && (
                                <div>
                                  <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 block">
                                    Выберите экран
                                  </Label>
                                  <Select
                                    value={option.target || ''}
                                    onValueChange={(value) => {
                                      const updatedOptions = [...(selectedNode.data.responseOptions || [])];
                                      updatedOptions[index] = { ...option, target: value };
                                      onNodeUpdate(selectedNode.id, { responseOptions: updatedOptions });
                                    }}
                                  >
                                    <SelectTrigger className="text-xs border-blue-200 dark:border-blue-700 focus:border-blue-500">
                                      <SelectValue placeholder="Выберите экран или введите ID вручную" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {/* Команды */}
                                      {getAllNodesFromAllSheets
                                        ?.filter(n => n.node.id !== selectedNode.id && (n.node.type === 'start' || n.node.type === 'command'))
                                        .map(({node, sheetName}) => (
                                          <SelectItem key={node.id} value={node.id}>
                                            <div className="flex items-center gap-2">
                                              <i className="fas fa-terminal text-xs text-purple-500"></i>
                                              <span>{node.data.command}</span>
                                              <span className="text-xs text-blue-600 dark:text-blue-400">({sheetName})</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      
                                      {/* Другие узлы */}
                                      {getAllNodesFromAllSheets
                                        ?.filter(n => n.node.id !== selectedNode.id && n.node.type !== 'start' && n.node.type !== 'command')
                                        .map(({node, sheetName}) => {
                                          const nodeName = 
                                            node.type === 'message' ? 'Сообщение' :
                                            node.type === 'photo' ? 'Фото' :
                                            node.type === 'video' ? 'Видео' :
                                            node.type === 'audio' ? 'Аудио' :
                                            node.type === 'document' ? 'Документ' :
                                            node.type === 'keyboard' ? 'Клавиатура' :
                                            node.data?.collectUserInput ? 'Сбор данных' :
                                            node.type === 'location' ? 'Геолокация' :
                                            node.type === 'contact' ? 'Контакт' :
                                            node.type === 'sticker' ? 'Стикер' :
                                            node.type === 'voice' ? 'Голосовое' :
                                            node.type === 'animation' ? 'Анимация' : 'Узел';
                                          
                                          const iconClass = 
                                            node.type === 'message' ? 'fas fa-comment text-blue-500' :
                                            node.type === 'photo' ? 'fas fa-image text-green-500' :
                                            node.type === 'video' ? 'fas fa-video text-red-500' :
                                            node.type === 'audio' ? 'fas fa-music text-orange-500' :
                                            node.type === 'document' ? 'fas fa-file text-gray-500' :
                                            node.type === 'keyboard' ? 'fas fa-keyboard text-yellow-500' :
                                            node.data?.collectUserInput ? 'fas fa-user-edit text-indigo-500' :
                                            node.type === 'location' ? 'fas fa-map-marker-alt text-pink-500' :
                                            node.type === 'contact' ? 'fas fa-address-book text-teal-500' :
                                            node.type === 'sticker' ? 'fas fa-smile text-yellow-400' :
                                            node.type === 'voice' ? 'fas fa-microphone text-blue-400' :
                                            node.type === 'animation' ? 'fas fa-play-circle text-green-400' : 'fas fa-cube text-gray-400';
                                          
                                          return (
                                            <SelectItem key={node.id} value={node.id}>
                                              <div className="flex items-center gap-2">
                                                <i className={`${iconClass} text-xs`}></i>
                                                <span>{nodeName}</span>
                                                <span className="text-xs text-blue-600 dark:text-blue-400">({sheetName})</span>
                                              </div>
                                            </SelectItem>
                                          );
                                        })}
                                    </SelectContent>
                                  </Select>
                                  
                                  {/* Manual ID input */}
                                  <Input
                                    value={option.target || ''}
                                    onChange={(e) => {
                                      const updatedOptions = [...(selectedNode.data.responseOptions || [])];
                                      updatedOptions[index] = { ...option, target: e.target.value };
                                      onNodeUpdate(selectedNode.id, { responseOptions: updatedOptions });
                                    }}
                                    className="text-xs border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200 mt-1"
                                    placeholder="или введите ID экрана вручную"
                                  />
                                </div>
                              )}

                              {option.action === 'command' && (
                                <div>
                                  <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 block">
                                    Команда для выполнения
                                  </Label>
                                  <Input
                                    value={option.target || ''}
                                    onChange={(e) => {
                                      const updatedOptions = [...(selectedNode.data.responseOptions || [])];
                                      updatedOptions[index] = { ...option, target: e.target.value };
                                      onNodeUpdate(selectedNode.id, { responseOptions: updatedOptions });
                                    }}
                                    className="text-xs border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                                    placeholder="например: /start, /help, /menu"
                                  />
                                </div>
                              )}

                              {option.action === 'url' && (
                                <div>
                                  <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 block">
                                    Ссылка для открытия
                                  </Label>
                                  <Input
                                    value={option.url || ''}
                                    onChange={(e) => {
                                      const updatedOptions = [...(selectedNode.data.responseOptions || [])];
                                      updatedOptions[index] = { ...option, url: e.target.value };
                                      onNodeUpdate(selectedNode.id, { responseOptions: updatedOptions });
                                    }}
                                    className="text-xs border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                                    placeholder="https://example.com"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variable Name */}
                  <div>
                    <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                      <i className="fas fa-tag mr-1"></i>
                      Название для ответа
                    </Label>
                    <Input
                      value={selectedNode.data.inputVariable || ''}
                      onChange={(e) => onNodeUpdate(selectedNode.id, { inputVariable: e.target.value })}
                      className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                      placeholder="например: имя_пользователя, почта, телефон"
                    />
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Под этим названием будет сохранен ответ пользователя
                    </div>
                  </div>

                  {/* Target Node After Text Input */}
                  <div>
                    <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                      <i className="fas fa-arrow-right mr-1"></i>
                      Куда перейти после получения ответа
                    </Label>
                    <div className="space-y-2">
                      <Select
                        value={selectedNode.data.inputTargetNodeId || 'no-transition'}
                        onValueChange={(value) => {
                          onNodeUpdate(selectedNode.id, { inputTargetNodeId: value === 'no-transition' ? undefined : value });
                        }}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Выберите следующий шаг" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-transition">Не переходить</SelectItem>
                          {getAllNodesFromAllSheets.filter(n => n.node.id !== selectedNode.id).map(({node, sheetName}) => {
                            const nodeContent = 
                              node.type === 'command' ? node.data.command :
                              node.type === 'message' ? ((node.data as any).messageText || '').slice(0, 50) :
                              node.type === 'photo' ? ((node.data as any).photoCaption || '').slice(0, 50) :
                              node.type === 'keyboard' ? ((node.data as any).keyboardText || '').slice(0, 50) :
                              ((node.data as any).label || '').slice(0, 50);
                            return (
                              <SelectItem key={node.id} value={node.id}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{node.type}</span>
                                  <span className="text-xs font-mono text-muted-foreground">{node.id}</span>
                                  <span>{nodeContent}</span>
                                  <span className="text-xs text-blue-600 dark:text-blue-400">({sheetName})</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      <div className="text-xs text-muted-foreground mb-1">
                        Или введите ID узла вручную (например: ylObKToWFsIl-opIcowPZ)
                      </div>
                      <Input
                        value={selectedNode.data.inputTargetNodeId && selectedNode.data.inputTargetNodeId !== 'no-transition' ? selectedNode.data.inputTargetNodeId : ''}
                        onChange={(e) => {
                          onNodeUpdate(selectedNode.id, { inputTargetNodeId: e.target.value || undefined });
                        }}
                        className="text-xs h-8"
                        placeholder="Введите ID узла вручную"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Узел, к которому перейти после получения ответа пользователя
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto Transition Section - скрыто для узлов управления */}
        {selectedNode.type !== 'pin_message' && 
         selectedNode.type !== 'unpin_message' && 
         selectedNode.type !== 'delete_message' &&
         selectedNode.type !== 'ban_user' && 
         selectedNode.type !== 'unban_user' && 
         selectedNode.type !== 'mute_user' && 
         selectedNode.type !== 'unmute_user' && 
         selectedNode.type !== 'kick_user' && 
         selectedNode.type !== 'promote_user' && 
         selectedNode.type !== 'demote_user' && 
         selectedNode.type !== 'admin_rights' &&
         (!selectedNode.data.buttons || selectedNode.data.buttons.length === 0) &&
         (selectedNode.data.keyboardType === 'none' || selectedNode.data.keyboardType === 'reply') && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">⚡ Автопереход</h3>
              <Switch
                checked={selectedNode.data.enableAutoTransition ?? false}
                onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { enableAutoTransition: checked })}
              />
            </div>
            <div className="space-y-4">
              {selectedNode.data.enableAutoTransition && (
                <div className="space-y-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-200/30 dark:border-emerald-800/30 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-3">
                    Сообщение будет отправлено, и бот автоматически перейдёт к следующему узлу без ожидания ответа от пользователя.
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2 block">
                      <i className="fas fa-arrow-right mr-1"></i>
                      Следующий узел
                    </Label>
                    <Select
                      value={selectedNode.data.autoTransitionTo || ''}
                      onValueChange={(value) => onNodeUpdate(selectedNode.id, { autoTransitionTo: value })}
                    >
                      <SelectTrigger className="border-emerald-200 dark:border-emerald-700 focus:border-emerald-500">
                        <SelectValue placeholder="Выберите узел для перехода" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllNodesFromAllSheets
                          .filter(({ node }) => node.id !== selectedNode.id)
                          .map(({ node, sheetId, sheetName }) => {
                            const nodeName = 
                              node.type === 'start' ? node.data.command :
                              node.type === 'command' ? node.data.command :
                              node.type === 'message' ? 'Сообщение' :
                              node.type === 'photo' ? 'Фото' :
                              node.type === 'video' ? 'Видео' :
                              node.type === 'audio' ? 'Аудио' :
                              node.type === 'document' ? 'Документ' : 'Узел';
                            
                            return (
                              <SelectItem key={`${sheetId}-${node.id}`} value={node.id}>
                                <div className="flex items-center gap-1">
                                  <span>{nodeName} ({node.id})</span>
                                  {sheetId !== currentSheetId && (
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400">({sheetName})</span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        
                        {(!getAllNodesFromAllSheets || getAllNodesFromAllSheets.filter(({ node }) => node.id !== selectedNode.id).length === 0) && (
                          <SelectItem value="no-nodes" disabled>
                            Создайте другие части бота для выбора
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      value={selectedNode.data.autoTransitionTo || ''}
                      onChange={(e) => onNodeUpdate(selectedNode.id, { autoTransitionTo: e.target.value })}
                      className="mt-2 text-xs border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 focus:ring-emerald-200"
                      placeholder="Или введите ID узла вручную"
                    />
                    
                    {selectedNode.data.autoTransitionTo && (
                      <div className="mt-2 p-2 bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded text-xs text-emerald-700 dark:text-emerald-300">
                        <i className="fas fa-info-circle mr-1"></i>
                        Бот автоматически перейдёт к узлу <strong>{selectedNode.data.autoTransitionTo}</strong> сразу после отправки этого сообщения
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Command Advanced Settings */}
        {(selectedNode.type === 'start' || selectedNode.type === 'command') && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced-settings" className="border-border">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline hover:text-foreground/90 transition-colors duration-200">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Расширенные настройки команды
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-gradient-to-br from-background to-muted/20 dark:from-background dark:to-muted/10 border border-border/50 rounded-lg mt-2 overflow-hidden">
                <div className="space-y-4 p-4">
                  {/* Show in Menu Setting */}
                  <div className="group flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-200">
                    <div className="flex-1">
                      <Label className="text-xs font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                        Показать в меню
                      </Label>
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Команда появится в меню @BotFather
                      </div>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={selectedNode.data.showInMenu ?? true}
                        onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { showInMenu: checked })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                  
                  {/* Private Only Setting */}
                  <div className="group flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-warning/30 hover:bg-card/80 transition-all duration-200">
                    <div className="flex-1">
                      <Label className="text-xs font-medium text-foreground group-hover:text-warning transition-colors duration-200">
                        Только в приватных чатах
                      </Label>
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Команда работает только в диалоге с ботом
                      </div>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={selectedNode.data.isPrivateOnly ?? false}
                        onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { isPrivateOnly: checked })}
                        className="data-[state=checked]:bg-warning"
                      />
                    </div>
                  </div>
                  

                  
                  {/* Admin Only Setting */}
                  <div className="group flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-destructive/30 hover:bg-card/80 transition-all duration-200">
                    <div className="flex-1">
                      <Label className="text-xs font-medium text-foreground group-hover:text-destructive transition-colors duration-200">
                        Только для администраторов
                      </Label>
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Команда доступна только админам
                      </div>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={selectedNode.data.adminOnly ?? false}
                        onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { adminOnly: checked })}
                        className="data-[state=checked]:bg-destructive"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <Separator />

        {/* Keyboard Advanced Settings */}
        {selectedNode.data.keyboardType === 'reply' && (
          <div className="bg-gradient-to-br from-background to-muted/20 dark:from-background dark:to-muted/10 border border-border/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-secondary/20 to-secondary/10 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-secondary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
                Настройки клавиатуры
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="group flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-secondary/30 hover:bg-card/80 transition-all duration-200">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-foreground group-hover:text-secondary transition-colors duration-200">
                    Одноразовая клавиатура
                  </Label>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Скрыть после нажатия
                  </div>
                </div>
                <div className="ml-4">
                  <Switch
                    checked={selectedNode.data.oneTimeKeyboard}
                    onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { oneTimeKeyboard: checked })}
                    className="data-[state=checked]:bg-secondary"
                  />
                </div>
              </div>
              
              <div className="group flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-secondary/30 hover:bg-card/80 transition-all duration-200">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-foreground group-hover:text-secondary transition-colors duration-200">
                    Изменить размер клавиатуры
                  </Label>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Подогнать под содержимое
                  </div>
                </div>
                <div className="ml-4">
                  <Switch
                    checked={selectedNode.data.resizeKeyboard}
                    onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { resizeKeyboard: checked })}
                    className="data-[state=checked]:bg-secondary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Properties Footer */}
      <div className="p-4 border-t border-border bg-gradient-to-r from-background to-muted/10 dark:from-background dark:to-muted/5">
        <div className="flex space-x-2">
          <UIButton 
            variant="outline" 
            className="flex-1 hover:bg-muted/80 dark:hover:bg-muted/60 transition-all duration-200"
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
          <UIButton className="flex-1 bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80 transition-all duration-200">
            Применить
          </UIButton>
        </div>
      </div>
    </aside>
  );
}
