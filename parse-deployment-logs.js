#!/usr/bin/env node

/**
 * Parse Full Deployment Logs
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

async function parseDeploymentLogs() {
  console.log('📋 Parsing Deployment Logs...\n');
  console.log('═'.repeat(70));

  try {
    const { data } = await coolifyRequest(`/api/v1/deployments/${DEPLOYMENT_UUID}`);
    
    console.log('Deployment Status:', data.status);
    console.log('Finished At:', data.finished_at);
    console.log('Commit:', data.commit?.substring(0, 7) || 'N/A');
    console.log('Commit Message:', data.commit_message || 'N/A');
    console.log('');
    console.log('═'.repeat(70));
    console.log('DEPLOYMENT LOGS:');
    console.log('═'.repeat(70));
    console.log('');

    // Parse the logs JSON
    let logs;
    try {
      logs = JSON.parse(data.logs);
    } catch (e) {
      console.log('Raw logs:', data.logs);
      return;
    }

    // Display logs in order
    logs.sort((a, b) => (a.order || 0) - (b.order || 0));

    let errorFound = false;
    let lastError = null;

    logs.forEach((log, index) => {
      const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '';
      const type = log.type || 'stdout';
      const output = log.output || '';
      
      // Check if this is an error
      const isError = type === 'stderr' || 
                     output.toLowerCase().includes('error') ||
                     output.toLowerCase().includes('failed') ||
                     output.toLowerCase().includes('fatal');

      if (isError) {
        errorFound = true;
        lastError = output;
      }

      // Show command if present
      if (log.command && !log.hidden) {
        console.log(`\n[${timestamp}] 🔧 Command: ${log.command}`);
      }

      // Show output (only non-hidden or errors)
      if ((!log.hidden || isError) && output) {
        const prefix = isError ? '❌ ' : '   ';
        console.log(`${prefix}${output}`);
      }
    });

    console.log('');
    console.log('═'.repeat(70));
    console.log('ANALYSIS:');
    console.log('═'.repeat(70));
    console.log('');
    console.log('Status:', data.status);
    
    if (errorFound && lastError) {
      console.log('');
      console.log('🔴 LAST ERROR FOUND:');
      console.log('   ', lastError);
      console.log('');
      
      // Analyze the error
      if (lastError.includes('No such file or directory')) {
        console.log('💡 DIAGNOSIS: File not found error');
        console.log('   Likely cause: Dockerfile or package.json not found in base directory');
        console.log('   Check: Base directory should be "/dashboard"');
      } else if (lastError.includes('npm install failed') || lastError.includes('npm ERR!')) {
        console.log('💡 DIAGNOSIS: npm install failed');
        console.log('   Likely cause: Dependency installation error');
        console.log('   Check: package.json and package-lock.json');
      } else if (lastError.includes('Dockerfile')) {
        console.log('💡 DIAGNOSIS: Dockerfile issue');
        console.log('   Likely cause: Dockerfile not found or syntax error');
        console.log('   Check: dashboard/Dockerfile exists and is valid');
      } else if (lastError.includes('No such container')) {
        console.log('💡 DIAGNOSIS: Container cleanup error (can be ignored)');
        console.log('   This is normal - container didn\'t exist to remove');
      } else {
        console.log('💡 DIAGNOSIS: Check the error message above');
      }
    } else {
      console.log('No obvious errors found in logs.');
      console.log('But deployment status is:', data.status);
      console.log('');
      console.log('This might mean:');
      console.log('- Build completed but health check failed');
      console.log('- Application crashed on startup');
      console.log('- Container exited unexpectedly');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

parseDeploymentLogs();
