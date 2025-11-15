#!/usr/bin/env node

/**
 * Get Recent Deployment Logs
 * Fetch actual error messages from Coolify
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

async function getDeploymentLogs() {
  console.log('📋 Fetching Deployment Logs...\n');
  console.log('═'.repeat(70));

  try {
    // Get application details first
    const { data: app } = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    
    console.log('\n📊 Application Status:');
    console.log('   Name:', app.name);
    console.log('   Status:', app.status);
    console.log('   Base Directory:', app.base_directory);
    
    // Try to get build logs
    console.log('\n📋 Attempting to fetch build logs...\n');
    
    // Try different log endpoints
    const endpoints = [
      `/api/v1/applications/${APP_UUID}/logs`,
      `/api/v1/applications/${APP_UUID}/logs?type=build`,
      `/api/v1/applications/${APP_UUID}/deployments`,
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`   Trying: ${endpoint}`);
        const { statusCode, data } = await coolifyRequest(endpoint);
        
        if (statusCode === 200 && data) {
          console.log('   ✅ Got response!\n');
          console.log('═'.repeat(70));
          console.log('LOGS:');
          console.log('═'.repeat(70));
          
          if (typeof data === 'string') {
            console.log(data);
          } else if (Array.isArray(data)) {
            console.log(`Found ${data.length} deployment(s):\n`);
            data.slice(0, 3).forEach((deployment, i) => {
              console.log(`Deployment ${i + 1}:`);
              console.log('  Status:', deployment.status || 'N/A');
              console.log('  Started:', deployment.created_at || 'N/A');
              console.log('  UUID:', deployment.uuid || 'N/A');
              if (deployment.logs) {
                console.log('  Logs:', deployment.logs.substring(0, 500) + '...');
              }
              console.log('');
            });
          } else {
            console.log(JSON.stringify(data, null, 2));
          }
          console.log('═'.repeat(70));
          break;
        } else {
          console.log(`   ❌ Status: ${statusCode}\n`);
        }
      } catch (e) {
        console.log(`   ❌ Error: ${e.message}\n`);
      }
    }

    // Get container status
    console.log('\n🐳 Container Information:');
    if (app.container_name) {
      console.log('   Container Name:', app.container_name);
    }
    if (app.docker_compose_location) {
      console.log('   Docker Compose:', app.docker_compose_location);
    }

    // Summary
    console.log('\n═'.repeat(70));
    console.log('💡 NEXT STEPS:');
    console.log('═'.repeat(70));
    console.log('\n1. Check the Coolify UI deployment page for detailed logs:');
    console.log(`   ${COOLIFY_BASE_URL}/project/${process.env.PROJECT_UUID}/application/${APP_UUID}/deployment`);
    console.log('\n2. Look for error messages containing:');
    console.log('   - "npm install failed"');
    console.log('   - "Dockerfile"');
    console.log('   - "ENOENT" (file not found)');
    console.log('   - "permission denied"');
    console.log('   - "build failed"');
    console.log('\n3. Share the error message and I can help fix it!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

getDeploymentLogs();
