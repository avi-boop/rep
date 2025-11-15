#!/usr/bin/env node

/**
 * Add Environment Variables to Application
 * Uses individual POST requests for each variable
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

async function addEnvironmentVariable(key, value, isSecret = true) {
  try {
    const body = {
      key: key,
      value: value,
      is_build_time: false,
      is_preview: false
    };
    
    const result = await coolifyRequest(`/api/v1/applications/${APP_UUID}/envs`, {
      method: 'POST',
      body: body
    });
    
    console.log(`   ✓ ${key}`);
    return true;
  } catch (error) {
    console.log(`   ✗ ${key}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Adding Environment Variables to Application       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n📝 Application UUID: ${APP_UUID}`);
  console.log(`🔐 Adding ${Object.keys(ENV_VARS).length} environment variables...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const [key, value] of Object.entries(ENV_VARS)) {
    const success = await addEnvironmentVariable(key, value);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n━'.repeat(60));
  console.log(`✅ Successfully added: ${successCount} variables`);
  console.log(`❌ Failed: ${failCount} variables`);
  console.log('━'.repeat(60));
  
  if (successCount > 0) {
    console.log('\n✅ Environment variables updated!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Open Coolify: https://coolify.theprofitplatform.com.au');
    console.log('   2. Go to Applications → avi-boop/rep:main');
    console.log('   3. Click "Deploy" to trigger deployment');
    console.log('   4. Monitor build logs (~10 minutes)');
    console.log('   5. After build, run: npx prisma migrate deploy');
    console.log('   6. Test: /api/health\n');
  } else {
    console.log('\n⚠️  All environment variable additions failed.');
    console.log('   You\'ll need to add them manually in Coolify UI.');
    console.log('\n📋 Environment Variables to Add:');
    console.log('━'.repeat(60));
    for (const [key, value] of Object.entries(ENV_VARS)) {
      console.log(`${key}=${value}`);
    }
    console.log('━'.repeat(60));
  }
}

main().catch(console.error);
