#!/usr/bin/env node

// Import required modules
import { seedDefaultTemplates } from './server/seed-templates.ts';

async function updateTemplates() {
  try {
    console.log('🔄 Updating templates with conditional button functionality...');
    await seedDefaultTemplates(true);
    console.log('✅ Templates updated successfully with conditional button support!');
  } catch (error) {
    console.error('❌ Error updating templates:', error);
    process.exit(1);
  }
  process.exit(0);
}

updateTemplates();