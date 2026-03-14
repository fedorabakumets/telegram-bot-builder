/**
 * @fileoverview Тесты для компонента FormattedText
 * Проверяет парсинг HTML и рендеринг форматирования
 * @module tests/components/formatted-text.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/formatted-text.test.tsx
 */

import { render, screen } from '@testing-library/react';
import { FormattedText } from '../../components/formatted-text';

describe('FormattedText', () => {
  describe('Рендеринг базового текста', () => {
    it('должен рендерить простой текст для бота', () => {
      render(<FormattedText text="Привет мир" messageType="bot" />);
      
      const textElement = screen.getByText('Привет мир');
      expect(textElement).toBeInTheDocument();
      expect(textElement.tagName).toBe('P');
    });

    it('должен рендерить простой текст для пользователя', () => {
      render(<FormattedText text="Привет мир" messageType="user" />);
      
      const textElement = screen.getByText('Привет мир');
      expect(textElement).toBeInTheDocument();
    });

    it('должен возвращать null для null текста', () => {
      const { container } = render(<FormattedText text={null} messageType="bot" />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null для undefined текста', () => {
      const { container } = render(<FormattedText text={undefined} messageType="bot" />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null для пустой строки', () => {
      const { container } = render(<FormattedText text="" messageType="bot" />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null для строки с пробелами', () => {
      const { container } = render(<FormattedText text="   " messageType="bot" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Форматирование текста', () => {
    it('должен рендерить жирный текст', () => {
      render(<FormattedText text="<b>Жирный</b>" messageType="bot" />);
      
      const boldElement = screen.getByText('Жирный');
      expect(boldElement).toHaveClass('font-bold');
    });

    it('должен рендерить жирный текст с тегом strong', () => {
      render(<FormattedText text="<strong>Жирный</strong>" messageType="bot" />);
      
      const boldElement = screen.getByText('Жирный');
      expect(boldElement).toHaveClass('font-bold');
    });

    it('должен рендерить курсив', () => {
      render(<FormattedText text="<i>Курсив</i>" messageType="bot" />);
      
      const italicElement = screen.getByText('Курсив');
      expect(italicElement).toHaveClass('italic');
    });

    it('должен рендерить курсив с тегом em', () => {
      render(<FormattedText text="<em>Курсив</em>" messageType="bot" />);
      
      const italicElement = screen.getByText('Курсив');
      expect(italicElement).toHaveClass('italic');
    });

    it('должен рендерить подчёркнутый текст', () => {
      render(<FormattedText text="<u>Подчёркнутый</u>" messageType="bot" />);
      
      const underlineElement = screen.getByText('Подчёркнутый');
      expect(underlineElement).toHaveClass('underline');
    });

    it('должен рендерить зачёркнутый текст', () => {
      render(<FormattedText text="<s>Зачёркнутый</s>" messageType="bot" />);
      
      const strikeElement = screen.getByText('Зачёркнутый');
      expect(strikeElement).toHaveClass('line-through');
    });

    it('должен рендерить зачёркнутый текст с тегом del', () => {
      render(<FormattedText text="<del>Зачёркнутый</del>" messageType="bot" />);
      
      const strikeElement = screen.getByText('Зачёркнутый');
      expect(strikeElement).toHaveClass('line-through');
    });

    it('должен рендерить код', () => {
      render(<FormattedText text="<code>console.log()</code>" messageType="bot" />);
      
      const codeElement = screen.getByText('console.log()');
      expect(codeElement).toHaveClass('font-mono');
    });

    it('должен рендерить pre', () => {
      render(<FormattedText text="<pre>Предварительно</pre>" messageType="bot" />);
      
      const preElement = screen.getByText('Предварительно');
      expect(preElement).toHaveClass('font-mono');
    });
  });

  describe('Ссылки', () => {
    it('должен рендерить ссылку с href', () => {
      render(<FormattedText text='<a href="https://example.com">Ссылка</a>' messageType="bot" />);
      
      const linkElement = screen.getByText('Ссылка');
      expect(linkElement).toHaveAttribute('href', 'https://example.com');
      expect(linkElement).toHaveAttribute('target', '_blank');
      expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('должен рендерить ссылку без href', () => {
      render(<FormattedText text='<a>Ссылка без href</a>' messageType="bot" />);
      
      const linkElement = screen.getByText('Ссылка без href');
      expect(linkElement).toHaveAttribute('href', '#');
    });
  });

  describe('Переносы строк', () => {
    it('должен обрабатывать br', () => {
      render(<FormattedText text="Строка 1<br>Строка 2" messageType="bot" />);
      
      const textElement = screen.getByText((content) => 
        content.includes('Строка 1') && content.includes('Строка 2')
      );
      expect(textElement).toBeInTheDocument();
    });

    it('должен обрабатывать br/', () => {
      render(<FormattedText text="Строка 1<br/>Строка 2" messageType="bot" />);
      
      const textElement = screen.getByText((content) => 
        content.includes('Строка 1') && content.includes('Строка 2')
      );
      expect(textElement).toBeInTheDocument();
    });
  });

  describe('Вложенное форматирование', () => {
    it('должен обрабатывать вложенные теги', () => {
      render(
        <FormattedText 
          text="<b>Жирный <i>и курсив</i></b>" 
          messageType="bot" 
        />
      );
      
      const boldElement = screen.getByText('Жирный');
      expect(boldElement).toHaveClass('font-bold');
      
      const italicElement = screen.getByText('и курсив');
      expect(italicElement).toHaveClass('italic');
    });

    it('должен обрабатывать несколько тегов', () => {
      render(
        <FormattedText 
          text="<b>Жирный</b> и <i>курсив</i>" 
          messageType="bot" 
        />
      );
      
      expect(screen.getByText('Жирный')).toHaveClass('font-bold');
      expect(screen.getByText('курсив')).toHaveClass('italic');
    });
  });

  describe('Стили', () => {
    it('должен применять стили для бота', () => {
      render(<FormattedText text="Текст" messageType="bot" />);
      
      const container = screen.getByText('Текст').parentElement;
      expect(container).toHaveClass('bg-blue-100');
      expect(container).toHaveClass('dark:bg-blue-900/50');
    });

    it('должен применять стили для пользователя', () => {
      render(<FormattedText text="Текст" messageType="user" />);
      
      const container = screen.getByText('Текст').parentElement;
      expect(container).toHaveClass('bg-green-100');
      expect(container).toHaveClass('dark:bg-green-900/50');
    });
  });
});
