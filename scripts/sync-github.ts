import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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

async function syncToGitHub() {
  try {
    console.log('🔄 Начинаем синхронизацию с GitHub...\n');

    // Получаем GitHub клиент
    const octokit = await getUncachableGitHubClient();
    
    // Проверяем подключение
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Авторизован как: ${user.login}\n`);

    // Получаем информацию о репозитории
    const owner = 'fedorabakumets';
    const repo = 'telegram-bot-builder';

    // Проверяем доступ к репозиторию
    try {
      const { data: repoInfo } = await octokit.repos.get({ owner, repo });
      console.log(`📦 Репозиторий: ${repoInfo.full_name}`);
      console.log(`🌐 URL: ${repoInfo.html_url}\n`);
    } catch (error: any) {
      console.error(`❌ Ошибка доступа к репозиторию: ${error.message}`);
      return;
    }

    console.log('📝 Инструкции для синхронизации:\n');
    console.log('1. Откройте вкладку "Shell" в Replit');
    console.log('2. Выполните следующие команды:\n');
    console.log('   git config user.name "' + user.login + '"');
    console.log('   git config user.email "' + (user.email || user.login + '@users.noreply.github.com') + '"');
    console.log('   git add .');
    console.log('   git commit -m "Update project from Replit"');
    console.log('   git push origin main\n');
    
    console.log('💡 Примечание: Вам может потребоваться ввести токен доступа при push.');
    console.log('   Используйте Personal Access Token из настроек GitHub.\n');

    // Показываем статистику
    try {
      const { data: branches } = await octokit.repos.listBranches({ owner, repo });
      console.log(`📊 Ветки репозитория: ${branches.map(b => b.name).join(', ')}`);
      
      const { data: commits } = await octokit.repos.listCommits({ 
        owner, 
        repo, 
        per_page: 1 
      });
      
      if (commits.length > 0) {
        console.log(`\n📅 Последний коммит:`);
        console.log(`   Автор: ${commits[0].commit.author?.name}`);
        console.log(`   Дата: ${commits[0].commit.author?.date}`);
        console.log(`   Сообщение: ${commits[0].commit.message}`);
      }
    } catch (error) {
      // Игнорируем ошибки при получении статистики
    }

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  }
}

syncToGitHub();
