#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

require('dotenv').config({ path: '/home/avi/projects/coolify/coolify-mcp/.env' });

const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL;
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;
const APP_UUID = 'zccwogo8g4884gwcgwk4wwoc';

function coolifyRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, COOLIFY_BASE_URL);
    
    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${COOLIFY_TOKEN}`,
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

async function main() {
  console.log('🔍 INVESTIGATING DEPLOYMENT FAILURE\n');
  
  try {
    // Get application details
    console.log('1️⃣  Application Status:');
    const app = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    console.log(`   Status: ${app.data.status || 'unknown'}`);
    console.log(`   Build Pack: ${app.data.build_pack || 'unknown'}`);
    console.log(`   Base Directory: ${app.data.base_directory || 'none'}`);
    console.log(`   Git Branch: ${app.data.git_branch || 'unknown'}`);
    console.log(`   Git Repo: ${app.data.git_repository || 'unknown'}`);
    console.log(`   Dockerfile: ${app.data.dockerfile_location || 'none'}`);
    
    // Check deployments
    console.log('\n2️⃣  Recent Deployments:');
    try {
      const deployments = await coolifyRequest(`/api/v1/applications/${APP_UUID}/deployments`);
      
      if (Array.isArray(deployments.data) && deployments.data.length > 0) {
        const latest = deployments.data[0];
        console.log(`   Latest Deployment:`);
        console.log(`     Status: ${latest.status || 'unknown'}`);
        console.log(`     Started: ${latest.created_at || 'unknown'}`);
        console.log(`     Updated: ${latest.updated_at || 'unknown'}`);
        
        if (latest.deployment_uuid || latest.uuid) {
          const depUuid = latest.deployment_uuid || latest.uuid;
          console.log(`     UUID: ${depUuid}`);
          
          // Try to get deployment details
          try {
            const details = await coolifyRequest(`/api/v1/deployments/${depUuid}`);
            console.log(`     Details:`);
            if (details.data.message) {
              console.log(`       Message: ${details.data.message}`);
            }
            if (details.data.error) {
              console.log(`       Error: ${details.data.error}`);
            }
          } catch (e) {
            console.log(`     Could not fetch details`);
          }
        }
      } else {
        console.log('   No deployments found');
      }
    } catch (e) {
      console.log(`   Error fetching deployments: ${e.message}`);
    }
    
    // Check environment variables
    console.log('\n3️⃣  Environment Variables Check:');
    const envs = await coolifyRequest(`/api/v1/applications/${APP_UUID}/envs`);
    
    if (Array.isArray(envs.data)) {
      const critical = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV', 'PORT'];
      console.log('   Critical variables:');
      critical.forEach(varName => {
        const found = envs.data.some(e => (e.key || e.name) === varName);
        console.log(`   ${found ? '✅' : '❌'} ${varName}`);
      });
      console.log(`   Total: ${envs.data.length} variables configured`);
    }
    
    // Check if container exists
    console.log('\n4️⃣  Container Information:');
    if (app.data.container_name) {
      console.log(`   Container Name: ${app.data.container_name}`);
    }
    if (app.data.container_status) {
      console.log(`   Container Status: ${app.data.container_status}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 DIAGNOSIS:');
    console.log('═══════════════════════════════════════════════════════════');
    
    const hasEnvVars = Array.isArray(envs.data) && envs.data.length > 0;
    const isHealthy = app.data.status && app.data.status.includes('healthy');
    
    if (hasEnvVars && !isHealthy) {
      console.log('✅ Environment variables are configured');
      console.log('❌ But application is not healthy\n');
      console.log('Possible causes:');
      console.log('  1. Build failed (check Coolify build logs)');
      console.log('  2. Database connection issue');
      console.log('  3. Dockerfile error');
      console.log('  4. Missing dependencies');
      console.log('  5. Prisma migration not run');
      console.log('\n💡 Check Coolify logs for specific error');
    } else if (!hasEnvVars) {
      console.log('❌ Environment variables NOT configured');
      console.log('\n💡 Add variables from:');
      console.log('   cat /home/avi/projects/mobile/COOLIFY_ENV_VARS_READY.txt');
    } else {
      console.log('✅ Everything looks configured');
      console.log('Check Coolify dashboard for deployment status');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
