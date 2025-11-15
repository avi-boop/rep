#!/usr/bin/env node

/**
 * Check Build/Deployment Status
 * Detailed check of what's happening
 */

const https = require('https');
const { URL } = require('url');
require('dotenv').config({ path: '.coolify-api' });

const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL;
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;
const APP_UUID = process.env.APP_UUID;

function coolifyRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, COOLIFY_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${COOLIFY_TOKEN}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function checkStatus() {
  console.log('🔍 Checking Build/Deployment Status\n');
  console.log('═'.repeat(70));

  try {
    // 1. Check application details
    console.log('\n1️⃣  APPLICATION DETAILS');
    console.log('─'.repeat(70));
    const { data: app } = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    
    console.log('Name:', app.name || 'N/A');
    console.log('Status:', app.status || 'unknown');
    console.log('Base Directory:', app.base_directory || '/');
    console.log('Build Pack:', app.build_pack || 'N/A');
    console.log('Git Branch:', app.git_branch || 'N/A');
    console.log('Git Repository:', app.git_repository || 'N/A');

    // 2. Check if there's a build running
    console.log('\n2️⃣  BUILD STATUS');
    console.log('─'.repeat(70));
    
    if (app.build_uuid) {
      console.log('Build UUID:', app.build_uuid);
      console.log('Status: Build in progress');
    } else {
      console.log('Status: No active build');
    }

    // 3. Check deployment queue
    console.log('\n3️⃣  DEPLOYMENT QUEUE');
    console.log('─'.repeat(70));
    
    if (app.is_deploying) {
      console.log('✅ Deployment is queued or in progress');
    } else {
      console.log('❌ No deployment in queue');
      console.log('\n⚠️  This means the deployment trigger may not have worked.');
      console.log('    Try deploying via Coolify UI instead.');
    }

    // 4. Check container status
    console.log('\n4️⃣  CONTAINER STATUS');
    console.log('─'.repeat(70));
    const containerStatus = app.status || 'unknown';
    
    if (containerStatus.includes('running')) {
      console.log('✅ Container is running');
    } else if (containerStatus.includes('exited')) {
      console.log('❌ Container has exited');
      console.log('   This usually means:');
      console.log('   - Build failed');
      console.log('   - Application crashed on startup');
      console.log('   - Health check failed');
    } else if (containerStatus.includes('building') || containerStatus.includes('deploying')) {
      console.log('🔨 Build/deployment in progress');
    } else {
      console.log('⚠️  Unknown status:', containerStatus);
    }

    // 5. Summary
    console.log('\n═'.repeat(70));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(70));
    console.log('Configuration: Base directory =', app.base_directory || '/');
    console.log('Current Status:', app.status || 'unknown');
    console.log('Is Deploying:', app.is_deploying ? 'Yes' : 'No');
    
    console.log('\n💡 RECOMMENDATION:');
    if (!app.is_deploying && containerStatus.includes('exited')) {
      console.log('');
      console.log('The deployment is not running. Try one of these:');
      console.log('');
      console.log('Option 1: Deploy via Coolify UI (Most Reliable)');
      console.log('  1. Open:', COOLIFY_BASE_URL);
      console.log('  2. Find: mobile-repair-dashboard');
      console.log('  3. Click: "Force Redeploy" button');
      console.log('');
      console.log('Option 2: Try API deploy again');
      console.log('  node coolify-deploy.js deploy');
      console.log('');
    } else if (app.is_deploying) {
      console.log('');
      console.log('✅ Deployment is in progress! Wait 10-15 minutes.');
      console.log('   Monitor at:', COOLIFY_BASE_URL + '/project/' + process.env.PROJECT_UUID + '/application/' + APP_UUID + '/deployment');
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkStatus();
