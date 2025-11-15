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
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data, raw: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

async function main() {
  console.log('🔍 DEEP DIVE: Checking All Coolify Endpoints\n');
  
  try {
    // 1. Get full application details
    console.log('1️⃣  Fetching full application details...');
    const app = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    console.log(`   Status Code: ${app.statusCode}`);
    
    if (app.data.status) {
      console.log(`   Application Status: ${app.data.status}`);
    }
    
    // Check for environment_variables in response
    if (app.data.environment_variables) {
      console.log(`   Environment Variables Found: ${app.data.environment_variables.length}`);
      if (app.data.environment_variables.length > 0) {
        console.log('   ✅ Variables present:');
        app.data.environment_variables.slice(0, 5).forEach(env => {
          console.log(`      - ${env.key || env.name || 'unknown'}`);
        });
        if (app.data.environment_variables.length > 5) {
          console.log(`      ... and ${app.data.environment_variables.length - 5} more`);
        }
      }
    } else {
      console.log('   ⚠️  No environment_variables field in response');
    }
    
    // 2. Check deployments
    console.log('\n2️⃣  Checking recent deployments...');
    try {
      const deployments = await coolifyRequest(`/api/v1/applications/${APP_UUID}/deployments`);
      if (deployments.data && Array.isArray(deployments.data)) {
        console.log(`   Found ${deployments.data.length} deployments`);
        if (deployments.data.length > 0) {
          const latest = deployments.data[0];
          console.log('   Latest deployment:');
          console.log(`      Status: ${latest.status || 'unknown'}`);
          console.log(`      Created: ${latest.created_at || 'unknown'}`);
          console.log(`      Updated: ${latest.updated_at || 'unknown'}`);
        }
      } else {
        console.log('   ⚠️  No deployments found or unexpected format');
      }
    } catch (e) {
      console.log(`   ⚠️  Could not fetch deployments: ${e.message}`);
    }
    
    // 3. Try alternative env endpoint
    console.log('\n3️⃣  Trying alternative environment endpoint...');
    try {
      const envs = await coolifyRequest(`/api/v1/applications/${APP_UUID}/envs`);
      console.log(`   Status Code: ${envs.statusCode}`);
      if (envs.data) {
        console.log(`   Response type: ${typeof envs.data}`);
        if (Array.isArray(envs.data)) {
          console.log(`   ✅ Found ${envs.data.length} environment variables`);
        } else if (typeof envs.data === 'object') {
          const keys = Object.keys(envs.data);
          console.log(`   Response has ${keys.length} keys: ${keys.slice(0, 3).join(', ')}`);
        }
      }
    } catch (e) {
      console.log(`   ⚠️  Could not fetch envs: ${e.message}`);
    }
    
    // 4. Check if application is actually running
    console.log('\n4️⃣  Checking application runtime status...');
    if (app.data.status) {
      console.log(`   Reported Status: ${app.data.status}`);
    }
    if (app.data.container_status) {
      console.log(`   Container Status: ${app.data.container_status}`);
    }
    if (app.data.health_check_enabled !== undefined) {
      console.log(`   Health Check Enabled: ${app.data.health_check_enabled}`);
    }
    
    // 5. Try to get logs
    console.log('\n5️⃣  Checking if logs endpoint exists...');
    try {
      const logs = await coolifyRequest(`/api/v1/applications/${APP_UUID}/logs?since=1h`);
      console.log(`   Logs endpoint status: ${logs.statusCode}`);
      if (logs.statusCode === 200) {
        console.log('   ✅ Logs endpoint accessible');
      }
    } catch (e) {
      console.log(`   ⚠️  Logs endpoint: ${e.message}`);
    }
    
    // 6. Check service name/project
    console.log('\n6️⃣  Application details...');
    console.log(`   Name: ${app.data.name || 'N/A'}`);
    console.log(`   UUID: ${app.data.uuid || 'N/A'}`);
    console.log(`   FQDN: ${app.data.fqdn || 'N/A'}`);
    console.log(`   Git Repository: ${app.data.git_repository || 'N/A'}`);
    console.log(`   Git Branch: ${app.data.git_branch || 'N/A'}`);
    console.log(`   Base Directory: ${app.data.base_directory || 'N/A'}`);
    console.log(`   Build Pack: ${app.data.build_pack || 'N/A'}`);
    
    // 7. Summary
    console.log('\n' + '═'.repeat(70));
    console.log('📊 SUMMARY:');
    console.log('═'.repeat(70));
    
    const hasEnvVars = app.data.environment_variables && app.data.environment_variables.length > 0;
    const isRunning = app.data.status && !app.data.status.includes('exited');
    
    console.log(`Environment Variables: ${hasEnvVars ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`);
    console.log(`Application Status: ${app.data.status || 'unknown'}`);
    console.log(`Running: ${isRunning ? '✅ YES' : '❌ NO'}`);
    
    if (!hasEnvVars) {
      console.log('\n⚠️  ENVIRONMENT VARIABLES ARE NOT CONFIGURED');
      console.log('   You need to add them in Coolify UI:\n');
      console.log('   cat /home/avi/projects/mobile/COOLIFY_ENV_VARS_READY.txt');
    } else {
      console.log('\n✅ Environment variables are configured!');
      if (!isRunning) {
        console.log('   But application is not running - check logs in Coolify');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
