#!/usr/bin/env node

/**
 * Coolify Deployment with Retries and Improved Error Handling
 * Uses updated Coolify MCP configuration with timeout and retry settings
 */

const https = require('https');
const { URL } = require('url');

require('dotenv').config({ path: '/home/avi/projects/coolify/coolify-mcp/.env' });

const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL;
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;
const TIMEOUT = parseInt(process.env.COOLIFY_API_TIMEOUT || '60000');
const MAX_RETRIES = parseInt(process.env.COOLIFY_API_MAX_RETRIES || '5');
const RETRY_DELAY = parseInt(process.env.COOLIFY_API_RETRY_DELAY || '2000');

const APP_UUID = 'zccwogo8g4884gwcgwk4wwoc';

// Environment variables from existing .env (fixed for production)
const ENV_VARS = {
  'DATABASE_URL': 'postgresql://postgres:rdqihD49wGAO78VpUY7QdG0EJewepwyk@31.97.222.218:54322/postgres?schema=public',
  'DIRECT_URL': 'postgresql://postgres:rdqihD49wGAO78VpUY7QdG0EJewepwyk@31.97.222.218:54322/postgres?schema=public',
  'NEXTAUTH_SECRET': 'a7d09394107e07093d1b5b9c40ad40927c31f3923e12ccbfb8a9bc3e161ca3524b8563fa8722939230a1a90dfedf3e218f67b6fcd4c22c858757692c5ab545a0',
  'NEXTAUTH_URL': 'https://repair.theprofitplatform.com.au',
  'JWT_SECRET': '9476bbfcf491a9ddb87cd160df8617916d4a3dd43f3ae081af19bed9849e339b191467635a769275b7eab966c38fd790e2dda870eaa7213e71363b4943271ff7',
  'REFRESH_TOKEN_SECRET': 'c8aac81b2b6f0cccccc657fc0cc0c965e48beb5da62201c2a5197d00b93fee21e325c4f9f05745a541d0a625b9e3035bf6005b75cd0e3f11100486a68d91ee49',
  'JWT_EXPIRES_IN': '24h',
  'REFRESH_TOKEN_EXPIRES_IN': '7d',
  'SESSION_SECRET': 'IeefGC4flJDVJVdLXsHCCvOYIJnI4TvGbisH84KKuVY=',
  'REDIS_URL': 'redis://repair-redis:6379',
  'NODE_ENV': 'production',
  'PORT': '3000',
  'HOSTNAME': '0.0.0.0',
  'NEXT_TELEMETRY_DISABLED': '1'
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
          resolve({ 
            statusCode: res.statusCode, 
            data: parsed, 
            raw: data,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (e) {
          resolve({ 
            statusCode: res.statusCode, 
            data: data, 
            raw: data,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function retryRequest(requestFn, maxRetries = MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await requestFn();
      if (result.success) {
        return result;
      }
      lastError = new Error(`HTTP ${result.statusCode}: ${result.raw}`);
      
      if (attempt < maxRetries) {
        console.log(`      Retry ${attempt}/${maxRetries} after ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.log(`      Retry ${attempt}/${maxRetries} after ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  throw lastError;
}

async function getExistingEnvVars() {
  try {
    const result = await retryRequest(() => 
      coolifyRequest(`/api/v1/applications/${APP_UUID}`)
    );
    
    const envVars = result.data.environment_variables || [];
    return envVars.map(env => env.key);
  } catch (error) {
    console.log(`   ⚠️  Could not fetch existing env vars: ${error.message}`);
    return [];
  }
}

async function addEnvVar(key, value) {
  // Try multiple payload formats
  const payloads = [
    // Format 1: Minimal
    { key, value },
    // Format 2: With is_preview only
    { key, value, is_preview: false },
    // Format 3: With both flags
    { key, value, is_preview: false, is_build_time: false },
  ];
  
  for (let i = 0; i < payloads.length; i++) {
    try {
      const result = await coolifyRequest(`/api/v1/applications/${APP_UUID}/envs`, {
        method: 'POST',
        body: payloads[i]
      });
      
      if (result.success) {
        return { success: true, format: i + 1 };
      }
    } catch (error) {
      // Continue to next format
    }
  }
  
  return { success: false };
}

async function updateAppConfig() {
  console.log('\n⚙️  Updating application configuration...');
  
  try {
    await retryRequest(() => 
      coolifyRequest(`/api/v1/applications/${APP_UUID}`, {
        method: 'PATCH',
        body: {
          name: 'mobile-repair-dashboard',
          description: 'Mobile Repair Dashboard - Production Ready'
        }
      })
    );
    console.log('   ✓ Application config updated\n');
    return true;
  } catch (error) {
    console.log(`   ℹ️  Config update: ${error.message}\n`);
    return false;
  }
}

async function triggerDeployment() {
  console.log('\n🚀 Triggering deployment...');
  
  const endpoints = [
    `/api/v1/deploy`,
    `/api/v1/applications/${APP_UUID}/restart`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = await retryRequest(() => 
        coolifyRequest(endpoint, {
          method: 'POST',
          body: endpoint.includes('deploy') ? { uuid: APP_UUID, force: true } : {}
        })
      );
      
      if (result.success) {
        console.log(`   ✓ Deployment triggered via ${endpoint}\n`);
        return true;
      }
    } catch (error) {
      console.log(`   ⚠️  ${endpoint}: ${error.message}`);
    }
  }
  
  console.log('   ℹ️  Trigger deployment manually in Coolify UI\n');
  return false;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Coolify Deployment with Enhanced Retry Logic         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📊 Configuration:`);
  console.log(`   Timeout: ${TIMEOUT}ms`);
  console.log(`   Max Retries: ${MAX_RETRIES}`);
  console.log(`   Retry Delay: ${RETRY_DELAY}ms`);
  console.log(`   Application: ${APP_UUID}\n`);
  
  try {
    // Step 1: Update app config
    await updateAppConfig();
    
    // Step 2: Get existing environment variables
    console.log('🔍 Checking existing environment variables...\n');
    const existing = await getExistingEnvVars();
    console.log(`   Found ${existing.length} existing variables\n`);
    
    // Step 3: Add missing environment variables
    console.log('📝 Adding environment variables...\n');
    
    let addedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    for (const [key, value] of Object.entries(ENV_VARS)) {
      if (existing.includes(key)) {
        console.log(`   ⊙ ${key} (already exists)`);
        skippedCount++;
        continue;
      }
      
      console.log(`   Adding ${key}...`);
      const result = await addEnvVar(key, value);
      
      if (result.success) {
        console.log(`      ✓ Added (format ${result.format})`);
        addedCount++;
      } else {
        console.log(`      ✗ Failed`);
        failedCount++;
      }
      
      await sleep(500);
    }
    
    console.log('\n━'.repeat(60));
    console.log(`📊 Results:`);
    console.log(`   ✓ Added: ${addedCount}`);
    console.log(`   ⊙ Skipped (existing): ${skippedCount}`);
    console.log(`   ✗ Failed: ${failedCount}`);
    console.log('━'.repeat(60) + '\n');
    
    // Step 4: Trigger deployment
    const deployed = await triggerDeployment();
    
    // Summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                   DEPLOYMENT STATUS                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const totalConfigured = addedCount + skippedCount;
    const totalNeeded = Object.keys(ENV_VARS).length;
    
    if (totalConfigured === totalNeeded && deployed) {
      console.log('🎉 FULLY AUTOMATED SUCCESS!\n');
      console.log('✅ All environment variables configured');
      console.log('✅ Deployment triggered\n');
      console.log('⏳ Next steps:');
      console.log('   1. Monitor build logs in Coolify (~10 minutes)');
      console.log('   2. After build completes:');
      console.log('      npx prisma migrate deploy');
      console.log('   3. Test health endpoint:');
      console.log('      http://zccwogo8g4884gwcgwk4wwoc.31.97.222.218.sslip.io/api/health\n');
    } else {
      console.log('⚠️  PARTIAL SUCCESS\n');
      console.log(`Environment Variables: ${totalConfigured}/${totalNeeded} configured`);
      console.log(`Deployment: ${deployed ? 'Triggered' : 'Needs manual trigger'}\n`);
      
      if (failedCount > 0) {
        console.log(`Failed variables (${failedCount}): Add manually in Coolify UI`);
        const failed = Object.keys(ENV_VARS).filter(k => !existing.includes(k));
        console.log('   Variables to add:');
        failed.slice(0, 5).forEach(k => console.log(`   - ${k}`));
        if (failed.length > 5) {
          console.log(`   ... and ${failed.length - 5} more\n`);
        }
      }
      
      if (!deployed) {
        console.log('Manual steps:');
        console.log('   1. Login to Coolify');
        console.log('   2. Click "Deploy" or "Redeploy" button\n');
      }
    }
    
    console.log('📋 Quick reference:');
    console.log('   cat /home/avi/projects/mobile/COOLIFY_ENV_VARS_READY.txt\n');
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error('\n💡 Fallback: Use manual deployment guide');
    console.error('   cat /home/avi/projects/mobile/FINAL_MANUAL_STEPS.md\n');
    process.exit(1);
  }
}

main().catch(console.error);
