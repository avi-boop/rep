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
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
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
  console.log('🔍 Parsing Environment Variables Response\n');
  
  try {
    const envResponse = await coolifyRequest(`/api/v1/applications/${APP_UUID}/envs`);
    
    console.log('Raw response type:', typeof envResponse);
    console.log('Is Array:', Array.isArray(envResponse));
    
    if (typeof envResponse === 'object' && envResponse !== null) {
      const keys = Object.keys(envResponse);
      console.log(`\nTotal keys in response: ${keys.length}\n`);
      
      // Check if it's an array-like object
      if (keys.every(k => !isNaN(k))) {
        console.log('✅ Response is array-like, converting...\n');
        const envArray = Object.values(envResponse);
        
        console.log(`Found ${envArray.length} environment variable entries\n`);
        console.log('Environment Variables Present:\n');
        
        const criticalVars = [
          'DATABASE_URL',
          'DIRECT_URL',
          'JWT_SECRET',
          'REFRESH_TOKEN_SECRET',
          'NEXTAUTH_SECRET',
          'NEXTAUTH_URL',
          'REDIS_URL',
          'NODE_ENV',
          'PORT',
          'HOSTNAME'
        ];
        
        let foundCount = 0;
        let missingVars = [];
        
        criticalVars.forEach(varName => {
          const found = envArray.some(env => {
            const key = env.key || env.name || env.KEY || env.NAME;
            return key === varName;
          });
          
          if (found) {
            console.log(`   ✅ ${varName}`);
            foundCount++;
          } else {
            console.log(`   ❌ ${varName}`);
            missingVars.push(varName);
          }
        });
        
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Found: ${foundCount}/${criticalVars.length} critical variables`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        if (missingVars.length > 0) {
          console.log('❌ Missing variables:');
          missingVars.forEach(v => console.log(`   - ${v}`));
          console.log('\n💡 Add missing variables in Coolify UI');
        } else {
          console.log('✅ ALL CRITICAL VARIABLES CONFIGURED!');
          console.log('\n🔄 If app is not running, try redeploying');
        }
        
        // Show first few variable keys for debugging
        console.log('\n📋 Sample variable keys in response:');
        envArray.slice(0, 5).forEach(env => {
          console.log(`   ${env.key || env.name || JSON.stringify(env).substring(0, 50)}`);
        });
        
      } else {
        console.log('Response structure:', keys.slice(0, 10));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
