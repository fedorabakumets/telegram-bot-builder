import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkWikiLinks from './src/remark/wiki-links';

/**
 * Конфиг сайта документации BotCraft на Docusaurus.
 * Контент берётся из ../docs (единый источник правды в репозитории).
 */
const config: Config = {
  title: 'BotCraft',
  tagline: 'Визуальный конструктор Telegram-ботов',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://fedorabakumets.github.io',
  baseUrl: '/telegram-bot-builder/',

  organizationName: 'fedorabakumets',
  projectName: 'telegram-bot-builder',
  trailingSlash: false,

  // Существующие md часто ссылаются на futures/ и относительные пути WikiNest
  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'ru',
    locales: ['ru'],
  },

  // Обычный Markdown: `{var}` в docs не ломает сборку как MDX-выражения
  markdown: {
    format: 'md',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl:
            'https://github.com/fedorabakumets/telegram-bot-builder/edit/main/docs/',
          beforeDefaultRemarkPlugins: [remarkWikiLinks],
          exclude: [
            'futures/**',
            'roadmaps/**',
            'smm/**',
            'bots/**',
            'assets/**',
            '**/_meta.json',
          ],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['ru', 'en'],
        indexDocs: true,
        docsRouteBasePath: 'docs',
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'BotCraft',
      logo: {
        alt: 'BotCraft',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Документация',
        },
        {
          href: 'https://github.com/fedorabakumets/telegram-bot-builder',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Документация',
          items: [
            {label: 'Быстрый старт', to: '/docs/development/INSTALLATION'},
            {label: 'Интерфейс', to: '/docs/interface/overview'},
            {label: 'Ноды', to: '/docs/nodes/overview'},
          ],
        },
        {
          title: 'Разработчикам',
          items: [
            {label: 'MCP', to: '/docs/mcp/overview'},
            {label: 'API', to: '/docs/api'},
            {
              label: 'Contributing',
              to: '/docs/development/CONTRIBUTING',
            },
          ],
        },
        {
          title: 'Ещё',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/fedorabakumets/telegram-bot-builder',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} BotCraft. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'python', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
