#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

require('dotenv').config({ path: '/home/avi/projects/coolify/coolify-mcp/.env' });

const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL;
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;
const APP_UUID = 'zccwogo8g4884gwcgwk4wwoc';

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
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ 
          statusCode: res.statusCode, 
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
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

async function main() {
  console.log('🚀 Triggering Coolify Redeploy...\n');
  console.log(`Application: ${APP_UUID}`);
  console.log(`Coolify: ${COOLIFY_BASE_URL}\n`);
  
  try {
    const result = await coolifyRequest(`/api/v1/deploy`, {
      method: 'POST',
      body: { uuid: APP_UUID, force: true }
    });
    
    if (result.success) {
      console.log('✅ Deployment triggered successfully!\n');
      console.log('📊 Build Status:');
      console.log('   • Pulling latest code from GitHub');
      console.log('   • Building Docker image with Dockerfile.production');
      console.log('   • Expected duration: 8-12 minutes\n');
      console.log('🔗 Monitor in Coolify:');
      console.log(`   ${COOLIFY_BASE_URL}/project/woc8ocogwoks4oc8oscswggw/application/${APP_UUID}\n`);
      console.log('⏳ Next: Wait for build to complete, then run migrations\n');
    } else {
      console.log('⚠️  Deployment response:', result.data);
      console.log('\n💡 Alternative: Trigger manually in Coolify UI\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Fallback: Trigger deployment manually:');
    console.log(`   1. Open: ${COOLIFY_BASE_URL}`);
    console.log('   2. Go to: Applications → mobile-repair-dashboard');
    console.log('   3. Click: "Deploy" or "Redeploy" button\n');
  }
}

main();
