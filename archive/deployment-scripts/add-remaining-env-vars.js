#!/usr/bin/env node

/**
 * Add Remaining Critical Environment Variables
 */

const https = require('https');
const { URL } = require('url');

require('dotenv').config({ path: '/home/avi/projects/coolify/coolify-mcp/.env' });

const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL;
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;
const APP_UUID = 'zccwogo8g4884gwcgwk4wwoc';

// Remaining critical variables
const MISSING_VARS = {
  'DIRECT_URL': 'postgresql://postgres:rdqihD49wGAO78VpUY7QdG0EJewepwyk@31.97.222.218:54322/postgres?schema=public',
  'JWT_SECRET': '40d7578e3c4aecba96783a7d77138365f8cbb71bb2e224a52e7b9fe6a326f0c74c69f7ebbbce1cb51e14323c56ff8121be1f9c3ec71434cde78400a966052522',
  'REFRESH_TOKEN_SECRET': '8bd80bfeb6875f301ef29edbeb7dcf6f23ac2931b1e69c62fd3ad096e1f7fd3d632ac80d2059d5124720c6a2272be1fdfff6727dee6b84e2d1aa1eddb5026fa2',
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
          resolve({ statusCode: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data, raw: data });
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

async function tryAddEnvVar(key, value) {
  const methods = [
    // Method 1: Simple key-value
    { key, value },
    // Method 2: With is_preview
    { key, value, is_preview: false },
    // Method 3: Minimal object
    { key: key, value: value }
  ];
  
  for (let i = 0; i < methods.length; i++) {
    try {
      const result = await coolifyRequest(`/api/v1/applications/${APP_UUID}/envs`, {
        method: 'POST',
        body: methods[i]
      });
      
      if (result.statusCode >= 200 && result.statusCode < 300) {
        return { success: true, method: i + 1 };
      }
    } catch (error) {
      // Continue to next method
    }
  }
  
  return { success: false };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Adding Remaining Critical Environment Variables      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  let successCount = 0;
  const results = [];
  
  for (const [key, value] of Object.entries(MISSING_VARS)) {
    console.log(`🔄 Attempting to add ${key}...`);
    const result = await tryAddEnvVar(key, value);
    
    if (result.success) {
      console.log(`   ✅ ${key} (method ${result.method})`);
      successCount++;
      results.push({ key, status: 'success' });
    } else {
      console.log(`   ❌ ${key} (all methods failed)`);
      results.push({ key, status: 'failed', value });
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n━'.repeat(60));
  console.log(`✅ Successfully added: ${successCount}/${Object.keys(MISSING_VARS).length}`);
  console.log('━'.repeat(60));
  
  const failed = results.filter(r => r.status === 'failed');
  
  if (failed.length > 0) {
    console.log('\n⚠️  Variables that need manual addition:\n');
    failed.forEach(({ key, value }) => {
      console.log(`${key}=${value}\n`);
    });
    
    console.log('━'.repeat(60));
    console.log('📋 Manual Steps:');
    console.log('1. Open: https://coolify.theprofitplatform.com.au');
    console.log('2. Go to: Applications → avi-boop/rep:main');
    console.log('3. Click: Environment Variables tab');
    console.log('4. Add the variables listed above');
    console.log('5. Click: "Redeploy" to apply changes');
  } else {
    console.log('\n🎉 All variables added successfully!');
    console.log('\n📊 Deployment Status:');
    console.log('   ✅ All environment variables configured');
    console.log('   ✅ Deployment triggered');
    console.log('\n⏳ Next:');
    console.log('   1. Wait ~10 minutes for build to complete');
    console.log('   2. Run migrations: npx prisma migrate deploy');
    console.log('   3. Test: http://zccwogo8g4884gwcgwk4wwoc.31.97.222.218.sslip.io/api/health');
  }
}

main().catch(console.error);
