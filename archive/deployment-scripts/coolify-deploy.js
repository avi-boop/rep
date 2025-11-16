#!/usr/bin/env node

/**
 * Coolify Deployment Helper for Claude Code
 * Simple interface to interact with Coolify API
 */

const https = require('https');
const { URL } = require('url');
require('dotenv').config({ path: '.coolify-api' });

const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL;
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;
const APP_UUID = process.env.APP_UUID;

if (!COOLIFY_TOKEN) {
  console.error('❌ Error: COOLIFY_TOKEN not found in .coolify-api');
  process.exit(1);
}

/**
 * Make HTTP request to Coolify API
 */
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
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * Command handlers
 */
const commands = {
  // Get application status
  async status() {
    console.log('📊 Fetching application status...\n');
    const { data } = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    
    console.log('Application:', data.name || 'mobile-repair-dashboard');
    console.log('Status:', data.status || 'unknown');
    console.log('Git Branch:', data.git_branch || 'main');
    console.log('Domain:', data.fqdn || 'not configured');
    console.log('');
    
    return data;
  },

  // Deploy application
  async deploy() {
    console.log('🚀 Triggering deployment...\n');
    
    const { data } = await coolifyRequest(`/api/v1/deploy`, {
      method: 'POST',
      body: {
        uuid: APP_UUID,
        force: true
      }
    });
    
    console.log('✅ Deployment started!');
    console.log('Deployment UUID:', data.deployment_uuid || 'N/A');
    console.log('\nMonitor at:', `${COOLIFY_BASE_URL}/project/${process.env.PROJECT_UUID}/application/${APP_UUID}/deployment`);
    console.log('');
    
    return data;
  },

  // Get environment variables
  async envs() {
    console.log('📝 Fetching environment variables...\n');
    const { data } = await coolifyRequest(`/api/v1/applications/${APP_UUID}/envs`);
    
    if (Array.isArray(data)) {
      console.log(`Total variables: ${data.length}\n`);
      data.forEach((env, i) => {
        const value = env.value?.length > 30 ? env.value.substring(0, 30) + '...' : env.value;
        console.log(`${i + 1}. ${env.key} = ${value}`);
      });
    } else {
      console.log('No environment variables found or unexpected format');
    }
    console.log('');
    
    return data;
  },

  // Add environment variable
  async addenv(key, value) {
    if (!key || !value) {
      console.error('❌ Usage: node coolify-deploy.js addenv KEY VALUE');
      process.exit(1);
    }

    console.log(`📝 Adding environment variable: ${key}\n`);
    
    const { data } = await coolifyRequest(`/api/v1/applications/${APP_UUID}/envs`, {
      method: 'POST',
      body: {
        key: key,
        value: value,
        is_build_time: false,
        is_preview: false
      }
    });
    
    console.log('✅ Environment variable added!');
    console.log('');
    
    return data;
  },

  // Get deployment logs
  async logs() {
    console.log('📋 Fetching recent deployment logs...\n');
    
    const { data } = await coolifyRequest(`/api/v1/applications/${APP_UUID}/logs?since=1h`);
    
    if (data && data.logs) {
      console.log(data.logs);
    } else {
      console.log('No logs available');
    }
    console.log('');
    
    return data;
  },

  // Update application settings
  async update(settings) {
    console.log('⚙️  Updating application settings...\n');
    
    const { data } = await coolifyRequest(`/api/v1/applications/${APP_UUID}`, {
      method: 'PATCH',
      body: settings
    });
    
    console.log('✅ Settings updated!');
    console.log('');
    
    return data;
  },

  // Health check
  async health() {
    console.log('🏥 Checking Coolify API health...\n');
    
    try {
      const { data, statusCode } = await coolifyRequest('/api/v1/applications');
      console.log('✅ API is healthy');
      console.log('Status Code:', statusCode);
      console.log('Total applications:', Array.isArray(data) ? data.length : 'N/A');
      console.log('');
      return { status: 'ok', statusCode };
    } catch (error) {
      console.error('❌ API health check failed:', error.message);
      console.log('');
      return { status: 'error', error: error.message };
    }
  },

  // List all applications
  async list() {
    console.log('📋 Listing all applications...\n');
    
    const { data } = await coolifyRequest('/api/v1/applications');
    
    if (Array.isArray(data)) {
      console.log(`Total applications: ${data.length}\n`);
      data.forEach((app, i) => {
        console.log(`${i + 1}. ${app.name || 'Unnamed'}`);
        console.log(`   UUID: ${app.uuid}`);
        console.log(`   Status: ${app.status || 'unknown'}`);
        console.log(`   Domain: ${app.fqdn || 'not configured'}`);
        console.log('');
      });
    }
    
    return data;
  },

  // Help
  help() {
    console.log(`
🚀 Coolify Deployment Helper

Usage: node coolify-deploy.js [command] [options]

Commands:
  health              Check API connectivity
  status              Get application status
  deploy              Trigger deployment
  envs                List environment variables
  addenv KEY VALUE    Add environment variable
  logs                Get recent deployment logs
  update              Update application settings
  list                List all applications
  help                Show this help message

Examples:
  node coolify-deploy.js health
  node coolify-deploy.js status
  node coolify-deploy.js deploy
  node coolify-deploy.js envs
  node coolify-deploy.js addenv DATABASE_URL "postgresql://..."
  node coolify-deploy.js logs

Configuration:
  Edit .coolify-api file to configure API credentials
    `);
  }
};

/**
 * Main execution
 */
async function main() {
  const [,, command, ...args] = process.argv;

  if (!command || command === 'help') {
    commands.help();
    return;
  }

  if (!commands[command]) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run "node coolify-deploy.js help" for usage\n');
    process.exit(1);
  }

  try {
    await commands[command](...args);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for programmatic use
module.exports = { coolifyRequest, commands };
