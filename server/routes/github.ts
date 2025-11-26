import express from 'express';
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

export const githubRouter = express.Router();

githubRouter.post('/push-to-github', async (req, res) => {
  try {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!token) {
      return res.status(400).json({ error: 'GitHub token not found' });
    }

    // Get git diff
    const diff = execSync('git diff --cached', { encoding: 'utf-8' });
    const changedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' }).split('\n').filter(f => f);

    if (changedFiles.length === 0) {
      return res.status(400).json({ error: 'No changes to push' });
    }

    const octokit = new Octokit({ auth: token });

    // Get current commit SHA
    const currentRef = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    
    // Create tree entries
    const treeEntries = [];
    for (const file of changedFiles) {
      const content = execSync(`git show :${file}`, { encoding: 'utf-8' });
      treeEntries.push({
        path: file,
        mode: '100644',
        type: 'blob',
        content
      });
    }

    // Create tree
    const treeResponse = await octokit.git.createTree({
      owner: 'fedorabakumets',
      repo: 'telegram-bot-builder',
      tree: treeEntries as any,
      base_tree: currentRef
    });

    // Create commit
    const commitResponse = await octokit.git.createCommit({
      owner: 'fedorabakumets',
      repo: 'telegram-bot-builder',
      message: 'Implement comprehensive action history system with real-time tracking',
      tree: treeResponse.data.sha,
      parents: [currentRef]
    });

    // Update ref
    await octokit.git.updateRef({
      owner: 'fedorabakumets',
      repo: 'telegram-bot-builder',
      ref: 'heads/main',
      sha: commitResponse.data.sha
    });

    res.json({ 
      success: true, 
      message: 'Successfully pushed to GitHub!',
      commit: commitResponse.data.sha 
    });
  } catch (error) {
    console.error('GitHub push error:', error);
    res.status(500).json({ error: (error as any).message });
  }
});
