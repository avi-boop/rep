#!/usr/bin/env node

/**
 * Create Mobile Repair Dashboard Application via Coolify MCP
 * Uses the Coolify MCP API client to create the application
 */

const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Load environment from coolify-mcp
require('dotenv').config({ path: '/home/avi/projects/coolify/coolify-mcp/.env' });

const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL || 'https://coolify.theprofitplatform.com.au';
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;

if (!COOLIFY_TOKEN) {
  console.error('❌ Error: COOLIFY_TOKEN not found');
  process.exit(1);
}

// Configuration
const CONFIG = {
  repository: 'https://github.com/avi-boop/rep',
  branch: 'main',
  baseDirectory: '/dashboard',
  dockerfile: 'Dockerfile.production',
  port: 3000,
  appName: 'mobile-repair-dashboard',
  redisName: 'repair-redis',
  supabaseDb: 'supabase-db',
  supabasePassword: 'rdqihD49wGAO78VpUY7QdG0EJewepwyk',
  jwtSecret: '40d7578e3c4aecba96783a7d77138365f8cbb71bb2e224a52e7b9fe6a326f0c74c69f7ebbbce1cb51e14323c56ff8121be1f9c3ec71434cde78400a966052522',
  refreshTokenSecret: '8bd80bfeb6875f301ef29edbeb7dcf6f23ac2931b1e69c62fd3ad096e1f7fd3d632ac80d2059d5124720c6a2272be1fdfff6727dee6b84e2d1aa1eddb5026fa2',
  nextAuthSecret: 'a7d09394107e07093d1b5b9c40ad40927c31f3923e12ccbfb8a9bc3e161ca3524b8563fa8722939230a1a90dfedf3e218f67b6fcd4c22c858757692c5ab545a0',
  nextAuthUrl: 'https://repair.theprofitplatform.com.au'
};

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
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: {} });
          } else {
            reject(new Error(`Parse error: ${e.message}, Data: ${data}`));
          }
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

/**
 * Get project and server IDs
 */
async function getProjectAndServer() {
  console.log('\n📋 Getting project and server information...');
  
  const [projects, servers] = await Promise.all([
    coolifyRequest('/api/v1/projects'),
    coolifyRequest('/api/v1/servers')
  ]);
  
  if (!projects.data || projects.data.length === 0) {
    throw new Error('No projects found');
  }
  if (!servers.data || servers.data.length === 0) {
    throw new Error('No servers found');
  }
  
  const project = projects.data[0];
  const server = servers.data[0];
  
  // Get environment
  const environments = project.environments || [];
  const environment = environments.length > 0 ? environments[0] : null;
  
  console.log(`   ✓ Project: ${project.name} (${project.uuid})`);
  console.log(`   ✓ Server: ${server.name} (${server.uuid})`);
  if (environment) {
    console.log(`   ✓ Environment: ${environment.name}`);
  }
  
  return {
    projectUuid: project.uuid,
    serverUuid: server.uuid,
    environmentName: environment ? environment.name : 'production',
    destinationUuid: server.uuid
  };
}

/**
 * Check if application already exists
 */
async function checkApplicationExists() {
  try {
    const apps = await coolifyRequest('/api/v1/applications');
    const app = apps.data.find(a => 
      a.name === CONFIG.appName || 
      (a.git_repository && a.git_repository.includes('avi-boop/rep'))
    );
    return app || null;
  } catch (error) {
    return null;
  }
}

/**
 * Create application
 */
async function createApplication(projectUuid, serverUuid, environmentName, destinationUuid) {
  console.log('\n🚀 Creating application...');
  
  // Check if already exists
  const existing = await checkApplicationExists();
  if (existing) {
    console.log(`   ⚠️  Application already exists!`);
    console.log(`   UUID: ${existing.uuid}`);
    console.log(`   Name: ${existing.name || 'N/A'}`);
    return existing;
  }
  
  // Create via API
  const appBody = {
    project_uuid: projectUuid,
    environment_name: environmentName,
    destination_uuid: destinationUuid,
    git_repository: CONFIG.repository,
    ports_exposes: CONFIG.port.toString()
  };
  
  try {
    const response = await coolifyRequest('/api/v1/applications', {
      method: 'POST',
      body: appBody
    });
    
    const appUuid = response.data.uuid;
    
    console.log(`   ✓ Application created!`);
    console.log(`   UUID: ${appUuid}`);
    console.log(`   Repository: ${CONFIG.repository}`);
    
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create application: ${error.message}`);
  }
}

/**
 * Update application configuration
 */
async function updateApplicationConfig(appUuid) {
  console.log('\n⚙️  Updating application configuration...');
  
  try {
    // Update build settings
    await coolifyRequest(`/api/v1/applications/${appUuid}`, {
      method: 'PATCH',
      body: {
        git_branch: CONFIG.branch,
        base_directory: CONFIG.baseDirectory,
        dockerfile_location: CONFIG.dockerfile,
        build_pack: 'dockerfile',
        ports_exposes: CONFIG.port.toString(),
        name: CONFIG.appName
      }
    });
    
    console.log(`   ✓ Build settings updated`);
    console.log(`   • Branch: ${CONFIG.branch}`);
    console.log(`   • Base Directory: ${CONFIG.baseDirectory}`);
    console.log(`   • Dockerfile: ${CONFIG.dockerfile}`);
    console.log(`   • Port: ${CONFIG.port}`);
    
    return true;
  } catch (error) {
    console.log(`   ⚠️  Could not update via API: ${error.message}`);
    console.log(`   → Manual update required in Coolify UI`);
    return false;
  }
}

/**
 * Set environment variables
 */
async function setEnvironmentVariables(appUuid) {
  console.log('\n🔐 Setting environment variables...');
  
  const envVars = `DATABASE_URL=postgresql://postgres:${CONFIG.supabasePassword}@31.97.222.218:54322/postgres?schema=public
DIRECT_URL=postgresql://postgres:${CONFIG.supabasePassword}@31.97.222.218:54322/postgres?schema=public
REDIS_URL=redis://${CONFIG.redisName}:6379
JWT_SECRET=${CONFIG.jwtSecret}
REFRESH_TOKEN_SECRET=${CONFIG.refreshTokenSecret}
NEXTAUTH_SECRET=${CONFIG.nextAuthSecret}
NEXTAUTH_URL=${CONFIG.nextAuthUrl}
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1`;
  
  try {
    await coolifyRequest(`/api/v1/applications/${appUuid}/envs`, {
      method: 'POST',
      body: { envs: envVars }
    });
    
    console.log(`   ✓ Environment variables set (13 variables)`);
    return true;
  } catch (error) {
    console.log(`   ⚠️  Could not set via API: ${error.message}`);
    console.log(`   → You'll need to set these manually in Coolify UI`);
    console.log('\n📋 Environment Variables to Set:');
    console.log('━'.repeat(60));
    console.log(envVars);
    console.log('━'.repeat(60));
    return false;
  }
}

/**
 * Deploy application
 */
async function deployApplication(appUuid) {
  console.log('\n🎯 Triggering deployment...');
  
  try {
    await coolifyRequest(`/api/v1/applications/${appUuid}/deploy`, {
      method: 'POST',
      body: {
        force_rebuild: true
      }
    });
    
    console.log(`   ✓ Deployment started!`);
    console.log(`   ⏳ Building... (this takes 5-10 minutes)`);
    return true;
  } catch (error) {
    console.log(`   ⚠️  Could not trigger deployment: ${error.message}`);
    console.log(`   → Trigger deployment manually in Coolify UI`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Mobile Repair Dashboard - MCP Automated Deployment      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n🎯 Target: ${COOLIFY_BASE_URL}`);
  console.log(`📦 Repository: ${CONFIG.repository}`);
  console.log(`🌿 Branch: ${CONFIG.branch}`);
  
  try {
    // Step 1: Get project and server
    const { projectUuid, serverUuid, environmentName, destinationUuid } = await getProjectAndServer();
    
    // Step 2: Create application
    const app = await createApplication(projectUuid, serverUuid, environmentName, destinationUuid);
    
    if (!app || !app.uuid) {
      throw new Error('Failed to create or find application');
    }
    
    const appUuid = app.uuid;
    
    // Step 3: Update configuration
    const configUpdated = await updateApplicationConfig(appUuid);
    
    // Step 4: Set environment variables
    const envsSet = await setEnvironmentVariables(appUuid);
    
    // Step 5: Deploy
    const deployed = await deployApplication(appUuid);
    
    // Success summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              APPLICATION CREATION COMPLETE!                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n📊 Status:');
    console.log(`   ✓ Application Created: ${appUuid}`);
    console.log(`   ${configUpdated ? '✓' : '⚠️'}  Configuration ${configUpdated ? 'Updated' : 'Needs Manual Update'}`);
    console.log(`   ${envsSet ? '✓' : '⚠️'}  Environment Variables ${envsSet ? 'Set' : 'Need Manual Setup'}`);
    console.log(`   ${deployed ? '✓' : '⚠️'}  Deployment ${deployed ? 'Started' : 'Needs Manual Trigger'}`);
    
    console.log('\n🔗 Next Steps:');
    console.log('   1. Open Coolify: https://coolify.theprofitplatform.com.au');
    console.log(`   2. Go to Applications → ${CONFIG.appName || appUuid}`);
    
    if (!configUpdated) {
      console.log('   3. Update Settings:');
      console.log(`      • Base Directory: ${CONFIG.baseDirectory}`);
      console.log(`      • Dockerfile: ${CONFIG.dockerfile}`);
      console.log(`      • Branch: ${CONFIG.branch}`);
    }
    
    if (!envsSet) {
      console.log('   4. Set Environment Variables (see above)');
    }
    
    if (!deployed) {
      console.log('   5. Click "Deploy" button');
    }
    
    console.log('   6. Monitor build logs (~10 minutes)');
    console.log('   7. After build, run migrations:');
    console.log('      npx prisma migrate deploy');
    console.log('   8. Test: /api/health');
    
    console.log('\n📝 Application UUID: ' + appUuid);
    console.log('   Save this for future operations!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check Coolify is accessible');
    console.error('   2. Verify API token has permissions');
    console.error('   3. Try manual creation via UI');
    console.error('   4. Check: /home/avi/projects/mobile/COOLIFY_DEPLOYMENT_FIX_PLAN.md');
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
