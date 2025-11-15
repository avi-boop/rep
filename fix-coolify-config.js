#!/usr/bin/env node

/**
 * Fix Coolify Configuration
 * Update base directory and other settings
 */

const { coolifyRequest } = require('./coolify-deploy.js');
require('dotenv').config({ path: '.coolify-api' });

const APP_UUID = process.env.APP_UUID;

async function fixConfiguration() {
  console.log('🔧 Fixing Coolify Configuration...\n');

  try {
    // Get current configuration
    console.log('1️⃣  Checking current configuration...');
    const { data: currentConfig } = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    
    console.log('   Current Base Directory:', currentConfig.base_directory || '(root)');
    console.log('   Current Build Pack:', currentConfig.build_pack || 'unknown');
    console.log('');

    // Update configuration
    console.log('2️⃣  Updating configuration...');
    
    const updates = {
      base_directory: 'dashboard',  // Point to dashboard folder
      dockerfile_location: 'Dockerfile',  // Dockerfile is in dashboard folder
      build_pack: 'dockerfile',
      ports_exposes: '3000',
      health_check_enabled: true,
      health_check_path: '/api/health',
      health_check_port: '3000',
      health_check_interval: 30,
      health_check_timeout: 10,
      health_check_retries: 3,
      health_check_return_code: 200
    };

    console.log('   Applying updates:');
    console.log('   - base_directory: dashboard');
    console.log('   - dockerfile_location: Dockerfile');
    console.log('   - build_pack: dockerfile');
    console.log('   - ports_exposes: 3000');
    console.log('   - health_check_path: /api/health');
    console.log('');

    const { data: result } = await coolifyRequest(`/api/v1/applications/${APP_UUID}`, {
      method: 'PATCH',
      body: updates
    });

    console.log('✅ Configuration updated successfully!\n');

    // Verify the changes
    console.log('3️⃣  Verifying changes...');
    const { data: newConfig } = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    
    console.log('   New Base Directory:', newConfig.base_directory || '(root)');
    console.log('   New Build Pack:', newConfig.build_pack || 'unknown');
    console.log('');

    console.log('✅ Configuration fix complete!');
    console.log('\n📋 Summary of changes:');
    console.log('   Before: Base Directory = / (root)');
    console.log('   After:  Base Directory = dashboard');
    console.log('');
    console.log('🚀 Ready to redeploy!');
    console.log('   Run: node coolify-deploy.js deploy');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTry updating manually in Coolify UI:');
    console.log('1. Go to Application Settings');
    console.log('2. Set Base Directory: dashboard');
    console.log('3. Set Dockerfile Location: Dockerfile');
    console.log('4. Save and redeploy');
    console.log('');
    process.exit(1);
  }
}

fixConfiguration();
