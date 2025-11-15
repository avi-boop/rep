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
    
    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${COOLIFY_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function main() {
  console.log('🔧 Fixing Dockerfile Path Configuration\n');
  
  console.log('Current configuration shows:');
  console.log('   dockerfile_location: /Dockerfile.production\n');
  
  console.log('Trying to update to: Dockerfile.production (without leading /)\n');
  
  try {
    const result = await coolifyRequest(`/api/v1/applications/${APP_UUID}`, {
      method: 'PATCH',
      body: {
        dockerfile_location: 'Dockerfile.production'
      }
    });
    
    if (result.success) {
      console.log('✅ Dockerfile path updated successfully!\n');
      console.log('Now triggering redeploy...\n');
      
      // Trigger redeploy
      const deploy = await coolifyRequest(`/api/v1/deploy`, {
        method: 'POST',
        body: { uuid: APP_UUID, force: true }
      });
      
      if (deploy.success) {
        console.log('✅ Deployment triggered!\n');
        console.log('📊 Build will:');
        console.log('   1. Use Dockerfile.production (correct file)');
        console.log('   2. Pull from /dashboard directory');
        console.log('   3. Build with all 30 environment variables');
        console.log('\n⏳ Expected build time: 8-12 minutes');
        console.log('\n🔗 Monitor at: https://coolify.theprofitplatform.com.au\n');
      } else {
        console.log('⚠️  Deploy trigger response:', deploy.data);
      }
    } else {
      console.log('⚠️  Update response:', result.data);
      console.log('\nTrying alternative format...\n');
      
      // Try without the field name
      const result2 = await coolifyRequest(`/api/v1/applications/${APP_UUID}`, {
        method: 'PATCH',
        body: {
          dockerfile: 'Dockerfile.production'
        }
      });
      
      console.log('Alternative result:', result2.status, result2.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Manual Fix:');
    console.log('   1. Open Coolify');
    console.log('   2. Go to Application Settings');
    console.log('   3. Set Dockerfile Location to: Dockerfile.production');
    console.log('      (or just: Dockerfile if using the basic one)');
    console.log('   4. Save and Redeploy');
  }
}

main();
