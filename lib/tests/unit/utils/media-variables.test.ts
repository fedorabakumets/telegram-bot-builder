/**
 * @fileoverview Тесты для утилит работы с медиапеременными
 * @module lib/tests/unit/utils/media-variables.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { findMediaVariablesInText } from '../../../bot-generator/utils/findMediaVariablesInText';
import { collectMediaVariables } from '../../../bot-generator/utils/collectMediaVariables';

describe('MediaVariables Utils', () => {
  describe('findMediaVariablesInText', () => {
    describe('поиск переменных в формате {variable}', () => {
      it('должна находить одну переменную в тексте', () => {
        // Arrange
        const text = 'Привет, {user_name}!';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'user_name');
      });

      it('должна находить несколько переменных в тексте', () => {
        // Arrange
        const text = '{first_name} {last_name}, ваш ID: {user_id}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 3);
        assert.deepStrictEqual(result, ['first_name', 'last_name', 'user_id']);
      });

      it('должна находить переменные с цифрами в имени', () => {
        // Arrange
        const text = 'Фото 1: {image_url_1}, Фото 2: {image_url_2}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 2);
        assert.deepStrictEqual(result, ['image_url_1', 'image_url_2']);
      });
    });

    describe('поиск переменных в формате {{variable}}', () => {
      it('должна находить переменные в двойных скобках', () => {
        // Arrange
        const text = 'Медиа: {{imageUrlVar_start}}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'imageUrlVar_start');
      });

      it('должна находить смешанные форматы переменных', () => {
        // Arrange
        const text = '{user_name} отправил {{imageUrlVar_photo}}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 2);
        assert.deepStrictEqual(result, ['user_name', 'imageUrlVar_photo']);
      });
    });

    describe('обработка граничных случаев', () => {
      it('должна возвращать пустой массив для текста без переменных', () => {
        // Arrange
        const text = 'Простой текст без переменных';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 0);
        assert.deepStrictEqual(result, []);
      });

      it('должна возвращать пустой массив для пустой строки', () => {
        // Arrange
        const text = '';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 0);
        assert.deepStrictEqual(result, []);
      });

      it('должна возвращать пустой массив для null/undefined', () => {
        // Act & Assert
        assert.deepStrictEqual(findMediaVariablesInText(null as any), []);
        assert.deepStrictEqual(findMediaVariablesInText(undefined as any), []);
      });

      it('должна игнорировать переменные с пустым именем', () => {
        // Arrange
        const text = 'Текст {} с пустой переменной';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 0);
      });

      it('должна обрезать пробелы вокруг имени переменной', () => {
        // Arrange
        const text = '{ user_name }';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'user_name');
      });

      it('должна находить переменные в начале строки', () => {
        // Arrange
        const text = '{user_name} привет!';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'user_name');
      });

      it('должна находить переменные в конце строки', () => {
        // Arrange
        const text = 'Привет, {user_name}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'user_name');
      });

      it('должна находить переменные с подчёркиваниями', () => {
        // Arrange
        const text = '{image_url_var} {video_url_var}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 2);
        assert.deepStrictEqual(result, ['image_url_var', 'video_url_var']);
      });

      it('должна находить переменные с CamelCase', () => {
        // Arrange
        const text = '{imageUrlVar} {videoUrlVar}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 2);
        assert.deepStrictEqual(result, ['imageUrlVar', 'videoUrlVar']);
      });

      it('должна находить переменные в многострочном тексте', () => {
        // Arrange
        const text = `Строка 1: {user_name}
Строка 2: {first_name}
Строка 3: {last_name}`;
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 3);
        assert.deepStrictEqual(result, ['user_name', 'first_name', 'last_name']);
      });
    });

    describe('поиск медиапеременных', () => {
      it('должна находить переменные image_url_*', () => {
        // Arrange
        const text = 'Фото: {image_url_start}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'image_url_start');
      });

      it('должна находить переменные imageUrlVar_*', () => {
        // Arrange
        const text = 'Фото: {imageUrlVar_menu}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'imageUrlVar_menu');
      });

      it('должна находить переменные video_url_*', () => {
        // Arrange
        const text = 'Видео: {video_url_intro}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'video_url_intro');
      });

      it('должна находить переменные audio_url_*', () => {
        // Arrange
        const text = 'Аудио: {audio_url_message}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'audio_url_message');
      });

      it('должна находить переменные document_url_*', () => {
        // Arrange
        const text = 'Документ: {document_url_file}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'document_url_file');
      });

      it('должна находить смешанные медиапеременные', () => {
        // Arrange
        const text = '{imageUrlVar_1} {video_url_2} {audioUrlVar_3}';
        
        // Act
        const result = findMediaVariablesInText(text);
        
        // Assert
        assert.strictEqual(result.length, 3);
        assert.deepStrictEqual(result, ['imageUrlVar_1', 'video_url_2', 'audioUrlVar_3']);
      });
    });
  });

  describe('collectMediaVariables', () => {
    describe('сбор переменных из photoInputVariable', () => {
      it('должна собирать переменные из enablePhotoInput и photoInputVariable', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              enablePhotoInput: true,
              photoInputVariable: 'user_photo'
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('user_photo'));
        assert.deepStrictEqual(result.get('user_photo'), { type: 'photo', variable: 'user_photo' });
      });
    });

    describe('сбор переменных из videoInputVariable', () => {
      it('должна собирать переменные из enableVideoInput и videoInputVariable', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              enableVideoInput: true,
              videoInputVariable: 'user_video'
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('user_video'));
        assert.deepStrictEqual(result.get('user_video'), { type: 'video', variable: 'user_video' });
      });
    });

    describe('сбор переменных из audioInputVariable', () => {
      it('должна собирать переменные из enableAudioInput и audioInputVariable', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              enableAudioInput: true,
              audioInputVariable: 'user_audio'
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('user_audio'));
        assert.deepStrictEqual(result.get('user_audio'), { type: 'audio', variable: 'user_audio' });
      });
    });

    describe('сбор переменных из documentInputVariable', () => {
      it('должна собирать переменные из enableDocumentInput и documentInputVariable', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              enableDocumentInput: true,
              documentInputVariable: 'user_document'
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('user_document'));
        assert.deepStrictEqual(result.get('user_document'), { type: 'document', variable: 'user_document' });
      });
    });

    describe('сбор переменных из attachedMedia', () => {
      it('должна собирать переменные из attachedMedia с image_url_*', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              attachedMedia: ['image_url_node1']
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('image_url_node1'));
        assert.deepStrictEqual(result.get('image_url_node1'), { type: 'photo', variable: 'image_url_node1' });
      });

      it('должна собирать переменные из attachedMedia с imageUrlVar_*', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              attachedMedia: ['imageUrlVar_start']
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('imageUrlVar_start'));
        assert.deepStrictEqual(result.get('imageUrlVar_start'), { type: 'photo', variable: 'imageUrlVar_start' });
      });

      it('должна собирать переменные из attachedMedia с video_url_*', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              attachedMedia: ['video_url_node1']
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('video_url_node1'));
        assert.deepStrictEqual(result.get('video_url_node1'), { type: 'video', variable: 'video_url_node1' });
      });

      it('должна собирать переменные из attachedMedia с audio_url_*', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              attachedMedia: ['audio_url_node1']
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('audio_url_node1'));
        assert.deepStrictEqual(result.get('audio_url_node1'), { type: 'audio', variable: 'audio_url_node1' });
      });

      it('должна собирать переменные из attachedMedia с document_url_*', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              attachedMedia: ['document_url_node1']
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('document_url_node1'));
        assert.deepStrictEqual(result.get('document_url_node1'), { type: 'document', variable: 'document_url_node1' });
      });

      it('должна собирать несколько переменных из attachedMedia', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              attachedMedia: ['image_url_1', 'video_url_2', 'audio_url_3']
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 3);
        assert.ok(result.has('image_url_1'));
        assert.ok(result.has('video_url_2'));
        assert.ok(result.has('audio_url_3'));
      });
    });

    describe('сбор переменных из imageUrl, videoUrl, audioUrl, documentUrl', () => {
      it('должна собирать переменную из imageUrl', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              imageUrl: 'https://example.com/image.jpg'
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('image_url_node1'));
        assert.deepStrictEqual(result.get('image_url_node1'), { type: 'photo', variable: 'image_url_node1' });
      });

      it('должна собирать переменную из videoUrl', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              videoUrl: 'https://example.com/video.mp4'
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('video_url_node1'));
        assert.deepStrictEqual(result.get('video_url_node1'), { type: 'video', variable: 'video_url_node1' });
      });

      it('должна собирать переменную из audioUrl', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              audioUrl: 'https://example.com/audio.mp3'
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('audio_url_node1'));
        assert.deepStrictEqual(result.get('audio_url_node1'), { type: 'audio', variable: 'audio_url_node1' });
      });

      it('должна собирать переменную из documentUrl', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              documentUrl: 'https://example.com/file.pdf'
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('document_url_node1'));
        assert.deepStrictEqual(result.get('document_url_node1'), { type: 'document', variable: 'document_url_node1' });
      });
    });

    describe('обработка граничных случаев', () => {
      it('должна возвращать пустую Map для пустого массива узлов', () => {
        // Arrange
        const nodes: any[] = [];
        
        // Act
        const result = collectMediaVariables(nodes);
        
        // Assert
        assert.strictEqual(result.size, 0);
      });

      it('должна возвращать пустую Map для null/undefined', () => {
        // Act & Assert
        assert.strictEqual(collectMediaVariables(null as any).size, 0);
        assert.strictEqual(collectMediaVariables(undefined as any).size, 0);
      });

      it('должна игнорировать null/undefined узлы в массиве', () => {
        // Arrange
        const nodes = [
          null,
          {
            id: 'node1',
            data: {
              enablePhotoInput: true,
              photoInputVariable: 'user_photo'
            }
          },
          undefined
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 1);
        assert.ok(result.has('user_photo'));
      });

      it('должна игнорировать узлы без data', () => {
        // Arrange
        const nodes = [
          { id: 'node1' },
          { id: 'node2', data: {} }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 0);
      });

      it('должна собирать переменные из нескольких узлов', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              enablePhotoInput: true,
              photoInputVariable: 'photo1'
            }
          },
          {
            id: 'node2',
            data: {
              enableVideoInput: true,
              videoInputVariable: 'video2'
            }
          },
          {
            id: 'node3',
            data: {
              attachedMedia: ['audio_url_3']
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 3);
        assert.ok(result.has('photo1'));
        assert.ok(result.has('video2'));
        assert.ok(result.has('audio_url_3'));
      });

      it('должна определять тип медиа по URL для http/https', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              attachedMedia: [
                'https://example.com/image.jpg',
                'https://example.com/video.mp4',
                'https://example.com/audio.mp3',
                'https://example.com/file.pdf'
              ]
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 4);
        assert.deepStrictEqual(result.get('https://example.com/image.jpg'), { type: 'photo', variable: 'https://example.com/image.jpg' });
        assert.deepStrictEqual(result.get('https://example.com/video.mp4'), { type: 'video', variable: 'https://example.com/video.mp4' });
        assert.deepStrictEqual(result.get('https://example.com/audio.mp3'), { type: 'audio', variable: 'https://example.com/audio.mp3' });
        assert.deepStrictEqual(result.get('https://example.com/file.pdf'), { type: 'document', variable: 'https://example.com/file.pdf' });
      });

      it('должна определять тип медиа по URL для локальных файлов', () => {
        // Arrange
        const nodes = [
          {
            id: 'node1',
            data: {
              attachedMedia: [
                '/uploads/image.png',
                '/uploads/video.webm',
                '/uploads/audio.ogg'
              ]
            }
          }
        ];
        
        // Act
        const result = collectMediaVariables(nodes as any);
        
        // Assert
        assert.strictEqual(result.size, 3);
        assert.deepStrictEqual(result.get('/uploads/image.png'), { type: 'photo', variable: '/uploads/image.png' });
        assert.deepStrictEqual(result.get('/uploads/video.webm'), { type: 'video', variable: '/uploads/video.webm' });
        assert.deepStrictEqual(result.get('/uploads/audio.ogg'), { type: 'audio', variable: '/uploads/audio.ogg' });
      });
    });
  });
});
