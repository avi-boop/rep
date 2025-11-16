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
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function main() {
  console.log('📊 Checking Deployment Status...\n');
  
  try {
    // Get application status
    const app = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    
    console.log('📦 Application:');
    console.log(`   Name: ${app.data.name || 'N/A'}`);
    console.log(`   Status: ${app.data.status || 'unknown'}`);
    console.log(`   URL: ${app.data.fqdn || 'N/A'}`);
    console.log(`   Health Check: ${app.data.health_check_path || 'N/A'}`);
    
    // Count environment variables
    const envVars = app.data.environment_variables || [];
    console.log(`\n🔐 Environment Variables: ${envVars.length} total`);
    
    const envKeys = envVars.map(env => env.key);
    const criticalVars = [
      'DATABASE_URL',
      'DIRECT_URL', 
      'JWT_SECRET',
      'REFRESH_TOKEN_SECRET',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'REDIS_URL',
      'JWT_EXPIRES_IN',
      'REFRESH_TOKEN_EXPIRES_IN',
      'NODE_ENV',
      'PORT'
    ];
    
    console.log('\n   Present:');
    criticalVars.forEach(key => {
      const exists = envKeys.includes(key);
      console.log(`   ${exists ? '✅' : '❌'} ${key}`);
    });
    
    // Try to get deployments
    try {
      const deployments = await coolifyRequest(`/api/v1/applications/${APP_UUID}/deployments`);
      
      if (deployments.data && deployments.data.length > 0) {
        const latest = deployments.data[0];
        console.log('\n🚀 Latest Deployment:');
        console.log(`   Status: ${latest.status || 'unknown'}`);
        console.log(`   Started: ${latest.created_at || 'N/A'}`);
      }
    } catch (e) {
      console.log('\n⚠️  Could not fetch deployment status');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
