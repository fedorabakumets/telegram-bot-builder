import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

/**
 * Hero-блок главной страницы документации
 * @returns JSX шапки лендинга
 */
function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/development/INSTALLATION">
            Быстрый старт
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/nodes/overview"
            style={{marginLeft: '0.75rem'}}>
            Справочник нод
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * Карточки разделов на главной
 */
const FEATURES = [
  {
    title: 'Интерфейс',
    to: '/docs/interface/overview',
    description: 'Редактор, холст, таблицы, рассылки и вкладки конструктора.',
  },
  {
    title: 'Ноды',
    to: '/docs/nodes/overview',
    description: 'Триггеры, действия, условия и полный справочник типов.',
  },
  {
    title: 'MCP и ИИ',
    to: '/docs/mcp/overview',
    description: 'Сборка ботов через Cursor MCP и промты для агентов.',
  },
] as const;

/**
 * Главная страница сайта документации BotCraft
 * @returns JSX страницы
 */
export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Документация визуального конструктора Telegram-ботов BotCraft">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="col col--4 margin-vert--md">
                  <Heading as="h3">
                    <Link to={feature.to}>{feature.title}</Link>
                  </Heading>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
