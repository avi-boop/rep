#!/usr/bin/env node

/**
 * Get Specific Deployment Logs
 */

const https = require('https');
const { URL } = require('url');
require('dotenv').config({ path: '.coolify-api' });

const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL;
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;
const DEPLOYMENT_UUID = 'okgw8kg8okkk84408cgcsgo8';

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
  console.log('📋 Fetching Deployment Logs...');
  console.log('Deployment UUID:', DEPLOYMENT_UUID);
  console.log('═'.repeat(70));

  try {
    // Try to get deployment details
    const endpoints = [
      `/api/v1/deployments/${DEPLOYMENT_UUID}`,
      `/api/v1/deployment/${DEPLOYMENT_UUID}`,
      `/api/v1/deployments/${DEPLOYMENT_UUID}/logs`,
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\nTrying: ${endpoint}`);
        const { statusCode, data } = await coolifyRequest(endpoint);
        
        console.log(`Status: ${statusCode}`);
        
        if (statusCode === 200 && data) {
          console.log('\n✅ Got deployment data!\n');
          console.log('═'.repeat(70));
          
          if (typeof data === 'string') {
            console.log(data);
          } else {
            console.log(JSON.stringify(data, null, 2));
          }
          
          console.log('═'.repeat(70));
          return;
        }
      } catch (e) {
        console.log(`Error: ${e.message}`);
      }
    }

    console.log('\n❌ Could not fetch deployment logs via API');
    console.log('\nPlease copy and paste the error from Coolify UI');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

getDeploymentLogs();
