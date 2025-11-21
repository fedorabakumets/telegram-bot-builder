import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function pushToGitHub(commitMessage: string = 'Update from Replit') {
  try {
    console.log('🔄 Начинаем обновление GitHub репозитория...\n');

    const octokit = await getUncachableGitHubClient();
    const owner = 'fedorabakumets';
    const repo = 'telegram-bot-builder';
    const branch = 'main';

    // Получаем информацию о пользователе
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Авторизован как: ${user.login}\n`);

    // Получаем токен для использования в git push
    const token = await getAccessToken();
    
    // Настраиваем git конфигурацию
    try {
      execSync(`git config user.name "${user.login}"`, { stdio: 'pipe' });
      execSync(`git config user.email "${user.email || user.login + '@users.noreply.github.com'}"`, { stdio: 'pipe' });
      console.log('✅ Git конфигурация настроена\n');
    } catch (error) {
      console.log('⚠️  Пропускаем настройку git конфигурации\n');
    }

    // Проверяем изменения
    let hasChanges = false;
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8', stdio: 'pipe' });
      hasChanges = status.trim().length > 0;
      
      if (hasChanges) {
        console.log('📝 Обнаружены изменения:\n');
        console.log(status);
      } else {
        console.log('ℹ️  Нет изменений для коммита\n');
      }
    } catch (error) {
      console.log('⚠️  Не удалось проверить статус изменений\n');
    }

    if (hasChanges) {
      console.log('\n📦 Для отправки изменений на GitHub выполните в Shell:\n');
      console.log('git add .');
      console.log(`git commit -m "${commitMessage}"`);
      console.log(`git push https://${token}@github.com/${owner}/${repo}.git ${branch}\n`);
      
      console.log('💡 Или используйте упрощенную команду:\n');
      console.log(`echo "${token}" | git push https://${user.login}@github.com/${owner}/${repo}.git ${branch}\n`);
    }

    // Показываем информацию о репозитории
    const { data: repoInfo } = await octokit.repos.get({ owner, repo });
    console.log(`\n📊 Информация о репозитории:`);
    console.log(`   Название: ${repoInfo.full_name}`);
    console.log(`   URL: ${repoInfo.html_url}`);
    console.log(`   Звезды: ⭐ ${repoInfo.stargazers_count}`);
    console.log(`   Форки: 🍴 ${repoInfo.forks_count}`);

    const { data: commits } = await octokit.repos.listCommits({ 
      owner, 
      repo, 
      per_page: 1 
    });
    
    if (commits.length > 0) {
      console.log(`\n📅 Последний коммит в репозитории:`);
      console.log(`   ${commits[0].commit.message.split('\n')[0]}`);
      console.log(`   ${commits[0].commit.author?.name} - ${new Date(commits[0].commit.author?.date || '').toLocaleString('ru-RU')}`);
    }

  } catch (error: any) {
    console.error('\n❌ Ошибка:', error.message);
    if (error.response) {
      console.error('Детали:', error.response.data);
    }
  }
}

const commitMessage = process.argv[2] || `🚀 Auto-sync from Replit - ${new Date().toISOString()}`;
pushToGitHub(commitMessage);
