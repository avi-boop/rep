#!/usr/bin/env node

/**
 * Complete Coolify Deployment via Browserless
 * Automates adding environment variables and deploying the mobile repair dashboard
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
require('dotenv').config({ path: '/home/avi/.env.browserless' });

const BROWSERLESS_WS = process.env.BROWSERLESS_WS_ENDPOINT;
const COOLIFY_URL = 'https://coolify.theprofitplatform.com.au';
const APP_NAME = 'mobile-repair-dashboard';

// Environment variables from existing .env
const ENV_VARS = {
  'DATABASE_URL': 'postgresql://postgres:rdqihD49wGAO78VpUY7QdG0EJewepwyk@31.97.222.218:54322/postgres?schema=public',
  'DIRECT_URL': 'postgresql://postgres:rdqihD49wGAO78VpUY7QdG0EJewepwyk@31.97.222.218:54322/postgres?schema=public',
  'NEXTAUTH_SECRET': 'a7d09394107e07093d1b5b9c40ad40927c31f3923e12ccbfb8a9bc3e161ca3524b8563fa8722939230a1a90dfedf3e218f67b6fcd4c22c858757692c5ab545a0',
  'NEXTAUTH_URL': 'https://repair.theprofitplatform.com.au',
  'JWT_SECRET': '9476bbfcf491a9ddb87cd160df8617916d4a3dd43f3ae081af19bed9849e339b191467635a769275b7eab966c38fd790e2dda870eaa7213e71363b4943271ff7',
  'REFRESH_TOKEN_SECRET': 'c8aac81b2b6f0cccccc657fc0cc0c965e48beb5da62201c2a5197d00b93fee21e325c4f9f05745a541d0a625b9e3035bf6005b75cd0e3f11100486a68d91ee49',
  'JWT_EXPIRES_IN': '24h',
  'REFRESH_TOKEN_EXPIRES_IN': '7d',
  'SESSION_SECRET': 'IeefGC4flJDVJVdLXsHCCvOYIJnI4TvGbisH84KKuVY=',
  'REDIS_URL': 'redis://repair-redis:6379',
  'NODE_ENV': 'production',
  'PORT': '3000',
  'HOSTNAME': '0.0.0.0',
  'NEXT_TELEMETRY_DISABLED': '1',
  // Optional integrations
  'LIGHTSPEED_DOMAIN_PREFIX': 'metrowireless',
  'LIGHTSPEED_PERSONAL_TOKEN': 'tphAEzTnEqLMnBmpRNHG10dxYbU4iLz1EQ0B2PCA',
  'GEMINI_API_KEY': 'AIzaSyCZ-48DwWrZEj3jcCUKsj4wW4vQHfDAP4M',
  'GEMINI_API_URL': 'https://generativelanguage.googleapis.com/v1beta',
  'FROM_EMAIL': 'noreply@theprofitplatform.com.au'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const filepath = `/tmp/coolify-deploy-${name}.png`;
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`   📸 Screenshot: ${filepath}`);
  return filepath;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║    Automated Coolify Deployment via Browserless           ║');
  console.log('║    Adding Environment Variables & Deploying                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('🌐 Connecting to Browserless...');
  console.log(`   Endpoint: ${BROWSERLESS_WS.split('?')[0]}`);

  const browser = await puppeteer.connect({
    browserWSEndpoint: BROWSERLESS_WS,
  });

  console.log('   ✓ Connected\n');

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log('🔐 Step 1: Opening Coolify...');
    console.log(`   URL: ${COOLIFY_URL}\n`);

    await page.goto(COOLIFY_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(3000);
    await takeScreenshot(page, '01-landing');

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}\n`);

    // Check if login required
    if (currentUrl.includes('login')) {
      console.log('⚠️  Coolify requires login\n');
      console.log('   Please ensure you are logged in...');
      console.log('   Waiting 10 seconds for manual login if needed...\n');
      await sleep(10000);
      
      // Check if still on login page
      const stillLoginPage = (await page.url()).includes('login');
      if (stillLoginPage) {
        console.log('   ⚠️  Still on login page - automation cannot proceed without login');
        console.log('   Please login manually and run this script again.\n');
        await browser.close();
        process.exit(1);
      }
    }

    console.log('   ✓ Logged in\n');

    // Step 2: Navigate to Applications
    console.log('📱 Step 2: Navigating to Applications...\n');
    
    // Try different navigation methods
    const navSelectors = [
      'a[href*="application"]',
      'text=Applications',
      'button:has-text("Applications")',
      '[data-testid="applications"]'
    ];

    let foundNav = false;
    for (const selector of navSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        foundNav = true;
        console.log(`   ✓ Clicked navigation: ${selector}\n`);
        await sleep(3000);
        break;
      } catch (e) {
        // Try next
      }
    }

    if (!foundNav) {
      // Try direct URL
      console.log('   Trying direct URL navigation...');
      await page.goto(`${COOLIFY_URL}/projects`, { waitUntil: 'networkidle2' });
      await sleep(3000);
    }

    await takeScreenshot(page, '02-applications');

    // Step 3: Find the mobile-repair-dashboard application
    console.log('🔍 Step 3: Finding mobile-repair-dashboard...\n');

    // Look for the application
    const appSelectors = [
      `text=${APP_NAME}`,
      `text=mobile-repair`,
      'text=avi-boop/rep',
      'a[href*="zccwogo8g4884gwcgwk4wwoc"]'
    ];

    let foundApp = false;
    for (const selector of appSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        foundApp = true;
        console.log(`   ✓ Found application: ${selector}\n`);
        await sleep(3000);
        break;
      } catch (e) {
        // Try next
      }
    }

    if (!foundApp) {
      // Try direct URL with app UUID
      console.log('   Trying direct application URL...');
      await page.goto(`${COOLIFY_URL}/project/woc8ocogwoks4oc8oscswggw/application/zccwogo8g4884gwcgwk4wwoc`, { 
        waitUntil: 'networkidle2' 
      });
      await sleep(3000);
    }

    await takeScreenshot(page, '03-application-page');

    // Step 4: Navigate to Environment Variables
    console.log('⚙️  Step 4: Opening Environment Variables...\n');

    const envTabSelectors = [
      'text=Environment Variables',
      'text=Environment',
      'a[href*="environment"]',
      'button:has-text("Environment")'
    ];

    let foundEnvTab = false;
    for (const selector of envTabSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        foundEnvTab = true;
        console.log(`   ✓ Opened Environment Variables tab\n`);
        await sleep(3000);
        break;
      } catch (e) {
        // Try next
      }
    }

    await takeScreenshot(page, '04-env-vars-page');

    // Step 5: Add Environment Variables
    console.log('📝 Step 5: Adding environment variables...\n');
    console.log(`   Total variables to add: ${Object.keys(ENV_VARS).length}\n`);

    let successCount = 0;
    let failCount = 0;

    for (const [key, value] of Object.entries(ENV_VARS)) {
      try {
        console.log(`   Adding: ${key}...`);

        // Look for "Add" or "New" button
        const addButtonSelectors = [
          'button:has-text("Add")',
          'button:has-text("New")',
          'button:has-text("Create")',
          '[data-testid="add-env"]'
        ];

        let clickedAdd = false;
        for (const selector of addButtonSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              clickedAdd = true;
              await sleep(1000);
              break;
            }
          } catch (e) {
            // Try next
          }
        }

        if (!clickedAdd) {
          console.log(`      ⚠️  Could not find Add button for ${key}`);
          failCount++;
          continue;
        }

        // Find input fields (usually 2: key and value)
        const inputs = await page.$$('input[type="text"], input:not([type])');
        
        if (inputs.length >= 2) {
          // Fill key
          await inputs[inputs.length - 2].click();
          await inputs[inputs.length - 2].type(key);
          await sleep(300);

          // Fill value
          await inputs[inputs.length - 1].click();
          await inputs[inputs.length - 1].type(value);
          await sleep(300);

          // Look for Save button
          const saveSelectors = [
            'button:has-text("Save")',
            'button:has-text("Add")',
            'button:has-text("Create")',
            'button[type="submit"]'
          ];

          for (const selector of saveSelectors) {
            try {
              const saveBtn = await page.$(selector);
              if (saveBtn) {
                await saveBtn.click();
                await sleep(1000);
                break;
              }
            } catch (e) {
              // Try next
            }
          }

          console.log(`      ✓ ${key}`);
          successCount++;
        } else {
          console.log(`      ⚠️  Could not find input fields for ${key}`);
          failCount++;
        }

        await sleep(500);

      } catch (error) {
        console.log(`      ✗ Failed: ${error.message}`);
        failCount++;
      }
    }

    console.log('\n━'.repeat(60));
    console.log(`📊 Results: ${successCount} added, ${failCount} failed`);
    console.log('━'.repeat(60) + '\n');

    await takeScreenshot(page, '05-env-vars-added');

    // Step 6: Trigger Deployment
    console.log('🚀 Step 6: Triggering deployment...\n');

    const deploySelectors = [
      'button:has-text("Deploy")',
      'button:has-text("Redeploy")',
      'button:has-text("Start")',
      '[data-testid="deploy"]'
    ];

    let deployed = false;
    for (const selector of deploySelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        deployed = true;
        console.log(`   ✓ Clicked Deploy button\n`);
        await sleep(3000);
        break;
      } catch (e) {
        // Try next
      }
    }

    if (!deployed) {
      console.log('   ⚠️  Could not find Deploy button');
      console.log('   You may need to manually click Deploy in Coolify\n');
    }

    await takeScreenshot(page, '06-deployment-triggered');

    // Success Summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              AUTOMATION COMPLETE!                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   ✓ Environment variables added: ${successCount}/${Object.keys(ENV_VARS).length}`);
    console.log(`   ${deployed ? '✓' : '⚠️'}  Deployment ${deployed ? 'triggered' : 'needs manual trigger'}\n`);

    console.log('📸 Screenshots saved:');
    console.log('   /tmp/coolify-deploy-*.png\n');

    if (successCount === Object.keys(ENV_VARS).length && deployed) {
      console.log('✅ Full automation successful!');
      console.log('\n⏳ Next steps:');
      console.log('   1. Wait ~10 minutes for build to complete');
      console.log('   2. Run: npx prisma migrate deploy');
      console.log('   3. Test: /api/health\n');
    } else {
      console.log('⚠️  Partial automation - manual steps needed:');
      if (successCount < Object.keys(ENV_VARS).length) {
        console.log(`   • Add remaining ${Object.keys(ENV_VARS).length - successCount} environment variables`);
      }
      if (!deployed) {
        console.log('   • Click "Deploy" button in Coolify');
      }
      console.log('');
    }

    console.log('🔗 Application URL:');
    console.log('   http://zccwogo8g4884gwcgwk4wwoc.31.97.222.218.sslip.io\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await takeScreenshot(page, 'error');
    console.error('   Screenshot saved: /tmp/coolify-deploy-error.png\n');
    
    console.log('💡 Fallback: Manual Deployment');
    console.log('   cat /home/avi/projects/mobile/COOLIFY_ENV_VARS_READY.txt\n');
  } finally {
    await browser.close();
    console.log('✓ Browser closed\n');
  }
}

main().catch(console.error);
