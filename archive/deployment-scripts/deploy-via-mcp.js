#!/usr/bin/env node

/**
 * Complete Deployment via Coolify API
 * Try multiple methods to add env vars and deploy
 */

const https = require('https');
const { URL } = require('url');

require('dotenv').config({ path: '/home/avi/projects/coolify/coolify-mcp/.env' });

const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL;
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;
const APP_UUID = 'zccwogo8g4884gwcgwk4wwoc';

const ENV_VARS = {
  'DATABASE_URL': 'postgresql://postgres:rdqihD49wGAO78VpUY7QdG0EJewepwyk@31.97.222.218:54322/postgres?schema=public',
  'DIRECT_URL': 'postgresql://postgres:rdqihD49wGAO78VpUY7QdG0EJewepwyk@31.97.222.218:54322/postgres?schema=public',
  'JWT_SECRET': '40d7578e3c4aecba96783a7d77138365f8cbb71bb2e224a52e7b9fe6a326f0c74c69f7ebbbce1cb51e14323c56ff8121be1f9c3ec71434cde78400a966052522',
  'REFRESH_TOKEN_SECRET': '8bd80bfeb6875f301ef29edbeb7dcf6f23ac2931b1e69c62fd3ad096e1f7fd3d632ac80d2059d5124720c6a2272be1fdfff6727dee6b84e2d1aa1eddb5026fa2',
  'NEXTAUTH_SECRET': 'a7d09394107e07093d1b5b9c40ad40927c31f3923e12ccbfb8a9bc3e161ca3524b8563fa8722939230a1a90dfedf3e218f67b6fcd4c22c858757692c5ab545a0',
  'NEXTAUTH_URL': 'https://repair.theprofitplatform.com.au',
  'REDIS_URL': 'redis://repair-redis:6379',
  'JWT_EXPIRES_IN': '24h',
  'REFRESH_TOKEN_EXPIRES_IN': '7d'
};

function coolifyRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, COOLIFY_BASE_URL);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${COOLIFY_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsed });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: data });
          } else {
            reject(new Error(`Parse error: ${e.message}, Data: ${data}`));
          }
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function addEnvVarMethod1(key, value) {
  // Method 1: Simple POST with just key and value
  try {
    await coolifyRequest(`/api/v1/applications/${APP_UUID}/envs`, {
      method: 'POST',
      body: { key, value }
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function addEnvVarMethod2(key, value) {
  // Method 2: POST with is_preview flag
  try {
    await coolifyRequest(`/api/v1/applications/${APP_UUID}/envs`, {
      method: 'POST',
      body: { 
        key, 
        value,
        is_preview: false
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function updateAppSettings() {
  console.log('\n⚙️  Updating application settings...');
  
  try {
    // Try to update with PATCH
    await coolifyRequest(`/api/v1/applications/${APP_UUID}`, {
      method: 'PATCH',
      body: {
        name: 'mobile-repair-dashboard',
        description: 'Mobile Repair Dashboard - Secure & Production Ready'
      }
    });
    console.log('   ✓ Application settings updated');
    return true;
  } catch (error) {
    console.log(`   ⚠️  Settings update: ${error.message}`);
    return false;
  }
}

async function triggerDeployment() {
  console.log('\n🚀 Attempting to trigger deployment...');
  
  const methods = [
    { 
      path: `/api/v1/applications/${APP_UUID}/deploy`,
      method: 'POST',
      body: { force_rebuild: true }
    },
    {
      path: `/api/v1/deploy`,
      method: 'POST', 
      body: { uuid: APP_UUID, force: true }
    },
    {
      path: `/api/v1/applications/${APP_UUID}/restart`,
      method: 'POST',
      body: {}
    }
  ];
  
  for (let i = 0; i < methods.length; i++) {
    try {
      const { path, method, body } = methods[i];
      console.log(`   Trying method ${i + 1}: ${method} ${path}`);
      
      await coolifyRequest(path, { method, body });
      console.log(`   ✓ Deployment triggered successfully!`);
      return true;
    } catch (error) {
      console.log(`   ✗ Method ${i + 1} failed: ${error.message}`);
    }
  }
  
  console.log('   ⚠️  All deployment methods failed');
  return false;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Complete Deployment via Coolify MCP                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n📝 Application UUID: ${APP_UUID}`);
  
  // Step 1: Update app settings
  await updateAppSettings();
  
  // Step 2: Add environment variables (try both methods)
  console.log('\n🔐 Adding environment variables...');
  let successCount = 0;
  
  for (const [key, value] of Object.entries(ENV_VARS)) {
    console.log(`   Testing ${key}...`);
    
    // Try method 1
    let success = await addEnvVarMethod1(key, value);
    if (!success) {
      // Try method 2
      success = await addEnvVarMethod2(key, value);
    }
    
    if (success) {
      console.log(`   ✓ ${key}`);
      successCount++;
    } else {
      console.log(`   ✗ ${key} (will need manual addition)`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n   Result: ${successCount}/${Object.keys(ENV_VARS).length} variables added`);
  
  // Step 3: Trigger deployment
  const deployed = await triggerDeployment();
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   DEPLOYMENT ATTEMPT COMPLETE              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  if (successCount === 0 && !deployed) {
    console.log('\n⚠️  API methods failed - Manual steps required:');
    console.log('\n1. Login: https://coolify.theprofitplatform.com.au');
    console.log('2. Go to: Applications → avi-boop/rep:main');
    console.log('3. Add environment variables (Environment Variables tab)');
    console.log('4. Click "Deploy" button');
    console.log('\n📋 Variables to add:');
    for (const [key, value] of Object.entries(ENV_VARS)) {
      console.log(`   ${key}=${value}`);
    }
  } else {
    console.log('\n✅ Progress made!');
    if (successCount > 0) {
      console.log(`   ✓ Added ${successCount} environment variables`);
    }
    if (deployed) {
      console.log('   ✓ Deployment triggered');
      console.log('\n⏳ Next steps:');
      console.log('   1. Monitor logs in Coolify (~10 minutes)');
      console.log('   2. After build completes:');
      console.log('      npx prisma migrate deploy');
      console.log('   3. Test: /api/health');
    } else {
      console.log('\n⏳ Manual trigger needed:');
      console.log('   1. Open Coolify');
      console.log('   2. Click "Deploy" button');
    }
    
    if (successCount < Object.keys(ENV_VARS).length) {
      console.log(`\n⚠️  ${Object.keys(ENV_VARS).length - successCount} variables need manual addition`);
    }
  }
  
  console.log('\n📊 Application URL:');
  console.log(`   http://zccwogo8g4884gwcgwk4wwoc.31.97.222.218.sslip.io`);
  console.log('\n📝 Full guide:');
  console.log('   cat /home/avi/projects/mobile/COOLIFY_FINAL_DEPLOYMENT_STEPS.md\n');
}

main().catch(console.error);
