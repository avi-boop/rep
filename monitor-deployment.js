#!/usr/bin/env node

/**
 * Monitor Deployment Progress
 * Checks status every 30 seconds
 */

const { coolifyRequest } = require('./coolify-deploy.js');
require('dotenv').config({ path: '.coolify-api' });

const APP_UUID = process.env.APP_UUID;
const MAX_CHECKS = 40; // 20 minutes max
const CHECK_INTERVAL = 30000; // 30 seconds

let checkCount = 0;
let lastStatus = null;

async function checkDeployment() {
  try {
    checkCount++;
    console.log(`\n[${new Date().toLocaleTimeString()}] Check #${checkCount}/${MAX_CHECKS}`);
    console.log('━'.repeat(60));

    // Get application status
    const { data } = await coolifyRequest(`/api/v1/applications/${APP_UUID}`);
    
    const status = data.status || 'unknown';
    const isRunning = status.includes('running') || status.includes('healthy');
    const isBuilding = status.includes('building') || status.includes('deploying');
    
    console.log(`Status: ${status}`);
    console.log(`Domain: ${data.fqdn || 'not configured'}`);
    
    // Check if status changed
    if (status !== lastStatus) {
      console.log(`✨ Status changed: ${lastStatus || 'initial'} → ${status}`);
      lastStatus = status;
    }

    // Check if deployment succeeded
    if (isRunning) {
      console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
      console.log('━'.repeat(60));
      console.log('\n🎉 Application is running!');
      console.log(`\n📍 URL: https://${data.fqdn}`);
      console.log('\n🧪 Test health check:');
      console.log(`   curl https://${data.fqdn}/api/health`);
      console.log('\n🔐 Access login page:');
      console.log(`   https://${data.fqdn}/login`);
      console.log('');
      process.exit(0);
    }

    // Check if building
    if (isBuilding) {
      console.log('🔨 Build in progress...');
    }

    // Check if deployment failed
    if (status.includes('failed') || status.includes('error')) {
      console.log('\n❌ DEPLOYMENT FAILED');
      console.log('━'.repeat(60));
      console.log('\nCheck logs for details:');
      console.log('   node coolify-deploy.js logs');
      console.log('\nView in Coolify UI:');
      console.log(`   ${process.env.COOLIFY_BASE_URL}/project/${process.env.PROJECT_UUID}/application/${APP_UUID}/deployment`);
      console.log('');
      process.exit(1);
    }

    // Continue monitoring
    if (checkCount >= MAX_CHECKS) {
      console.log('\n⏰ Maximum monitoring time reached (20 minutes)');
      console.log('Deployment may still be in progress.');
      console.log('\nCheck status manually:');
      console.log('   node coolify-deploy.js status');
      console.log('');
      process.exit(0);
    }

    // Schedule next check
    console.log(`\n⏳ Next check in 30 seconds...`);
    setTimeout(checkDeployment, CHECK_INTERVAL);

  } catch (error) {
    console.error('❌ Error checking deployment:', error.message);
    
    if (checkCount >= MAX_CHECKS) {
      process.exit(1);
    }
    
    console.log(`\n⏳ Retrying in 30 seconds...`);
    setTimeout(checkDeployment, CHECK_INTERVAL);
  }
}

console.log('🔍 Starting deployment monitoring...');
console.log('━'.repeat(60));
console.log(`Application: ${APP_UUID}`);
console.log(`Max duration: 20 minutes`);
console.log(`Check interval: 30 seconds`);
console.log('━'.repeat(60));

checkDeployment();
