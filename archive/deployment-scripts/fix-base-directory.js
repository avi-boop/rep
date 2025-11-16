#!/usr/bin/env node

/**
 * Fix Base Directory Configuration
 * Update only the base directory (API limitation)
 */

const { coolifyRequest } = require('./coolify-deploy.js');
require('dotenv').config({ path: '.coolify-api' });

const APP_UUID = process.env.APP_UUID;

async function fixBaseDirectory() {
  console.log('🔧 Fixing Base Directory Configuration...\n');

  try {
    // Get current configuration
    console.log('1️⃣  Checking current configuration...');
    const { data: currentConfig } = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    
    console.log('   Current Base Directory:', currentConfig.base_directory || '(root)');
    console.log('   Current Build Pack:', currentConfig.build_pack || 'unknown');
    console.log('');

    // Update only base directory (other fields cause validation errors)
    console.log('2️⃣  Updating base directory...');
    
    const updates = {
      base_directory: 'dashboard'
    };

    console.log('   Setting base_directory to: dashboard');
    console.log('');

    const { data: result } = await coolifyRequest(`/api/v1/applications/${APP_UUID}`, {
      method: 'PATCH',
      body: updates
    });

    console.log('✅ Base directory updated successfully!\n');

    // Verify the changes
    console.log('3️⃣  Verifying changes...');
    const { data: newConfig } = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    
    console.log('   New Base Directory:', newConfig.base_directory || '(root)');
    console.log('');

    console.log('✅ Configuration fix complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Base Directory: / → dashboard');
    console.log('   ✅ Dockerfile Location: Will look for Dockerfile in dashboard/');
    console.log('');
    console.log('🚀 Ready to redeploy!');
    console.log('   Run: node coolify-deploy.js deploy');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  The API update failed. Try manually in Coolify UI:');
    console.log('\n📍 Steps:');
    console.log('1. Open: https://coolify.theprofitplatform.com.au');
    console.log('2. Go to: mobile-repair-dashboard → General');
    console.log('3. Find: "Base Directory" field');
    console.log('4. Change from: / (or empty)');
    console.log('5. Change to: dashboard');
    console.log('6. Click: Save');
    console.log('7. Click: Redeploy');
    console.log('');
    process.exit(1);
  }
}

fixBaseDirectory();
