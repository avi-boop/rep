#!/usr/bin/env node

/**
 * Get Application Details from Coolify
 */

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
          resolve({ statusCode: res.statusCode, data: data });
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

async function main() {
  console.log('🔍 Getting application details...\n');
  
  try {
    // Get application details
    const app = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    
    console.log('📦 Application Details:');
    console.log('━'.repeat(60));
    console.log(JSON.stringify(app.data, null, 2));
    console.log('━'.repeat(60));
    
    // Get environment variables
    try {
      const envs = await coolifyRequest(`/api/v1/applications/${APP_UUID}/envs`);
      console.log('\n🔐 Environment Variables:');
      console.log('━'.repeat(60));
      console.log(JSON.stringify(envs.data, null, 2));
      console.log('━'.repeat(60));
    } catch (e) {
      console.log('\n⚠️  Could not fetch environment variables:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
