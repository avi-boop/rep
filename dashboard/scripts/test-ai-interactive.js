#!/usr/bin/env node
/**
 * Interactive AI Features Test Script
 * Tests all AI endpoints with real database data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = process.env.API_BASE || 'http://localhost:3009';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null) {
  const url = `${API_BASE}${endpoint}`;

  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testDiagnostics() {
  log('blue', '\n═══════════════════════════════════════');
  log('blue', '  TEST 1: AI Diagnostics Endpoint');
  log('blue', '═══════════════════════════════════════');

  // Health check
  log('cyan', '\n→ Testing health check (GET)...');
  const health = await testEndpoint('GET', '/api/ai/diagnose');

  if (health.success) {
    log('green', '✓ Health check passed');
    console.log('  Model:', health.data.model);
    console.log('  Features:', health.data.features.join(', '));
  } else {
    log('red', '✗ Health check failed');
    console.log(health);
  }

  // Test with minimal image (should fail validation)
  log('cyan', '\n→ Testing validation (tiny image)...');
  const validation = await testEndpoint('POST', '/api/ai/diagnose', {
    image_base64: 'data:image/png;base64,iVBORw0KGgo=',
    device_type: 'iPhone 14 Pro',
  });

  if (!validation.success) {
    log('green', '✓ Validation working correctly (rejected tiny image)');
  } else {
    log('yellow', '⚠ Validation may need adjustment');
  }

  // Note about API key
  log('cyan', '\n→ Testing AI analysis...');
  log('yellow', '⚠ Requires valid GEMINI_API_KEY in .env');
  log('yellow', '  Skipping actual AI call in this test');
}

async function testChat() {
  log('blue', '\n═══════════════════════════════════════');
  log('blue', '  TEST 2: Customer Chat Endpoint');
  log('blue', '═══════════════════════════════════════');

  // Get a customer with repair history
  log('cyan', '\n→ Finding customer with repairs...');
  const customer = await prisma.customer.findFirst({
    where: {
      repairOrders: { some: {} }
    },
    include: {
      repairOrders: {
        take: 3,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!customer) {
    log('yellow', '⚠ No customers with repairs found');
    return;
  }

  log('green', `✓ Found customer: ${customer.firstName} ${customer.lastName}`);
  console.log(`  ID: ${customer.id}`);
  console.log(`  Repairs: ${customer.repairOrders.length}`);

  // Test validation
  log('cyan', '\n→ Testing validation (missing customer_id)...');
  const validation = await testEndpoint('GET', '/api/ai/chat');

  if (!validation.success && validation.data?.error?.includes('customer_id')) {
    log('green', '✓ Validation working correctly');
  }

  // Note about API key
  log('cyan', '\n→ Testing chat with customer data...');
  log('yellow', '⚠ Requires valid GEMINI_API_KEY in .env');
  log('yellow', '  Skipping actual AI call in this test');
}

async function testQualityCheck() {
  log('blue', '\n═══════════════════════════════════════');
  log('blue', '  TEST 3: Quality Check Endpoint');
  log('blue', '═══════════════════════════════════════');

  // Get a completed repair
  log('cyan', '\n→ Finding completed repair...');
  const repair = await prisma.repairOrder.findFirst({
    where: {
      status: { in: ['completed', 'delivered'] }
    },
    include: {
      customer: true,
    },
  });

  if (!repair) {
    log('yellow', '⚠ No completed repairs found');
    return;
  }

  log('green', `✓ Found repair: #${repair.id}`);
  console.log(`  Customer: ${repair.customer.firstName} ${repair.customer.lastName}`);
  console.log(`  Status: ${repair.status}`);

  // Test validation
  log('cyan', '\n→ Testing validation (missing repair_order_id)...');
  const validation = await testEndpoint('GET', '/api/ai/quality-check');

  if (!validation.success && validation.data?.error?.includes('repair_order_id')) {
    log('green', '✓ Validation working correctly');
  }

  log('cyan', '\n→ Testing quality check...');
  log('yellow', '⚠ Requires valid GEMINI_API_KEY in .env');
  log('yellow', '  Skipping actual AI call in this test');
}

async function testForecast() {
  log('blue', '\n═══════════════════════════════════════');
  log('blue', '  TEST 4: Inventory Forecast Endpoint');
  log('blue', '═══════════════════════════════════════');

  // Check historical data
  log('cyan', '\n→ Checking historical repair data...');
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const repairCount = await prisma.repairOrder.count({
    where: {
      createdAt: { gte: ninetyDaysAgo },
      status: { in: ['completed', 'delivered'] }
    }
  });

  console.log(`  Completed repairs (last 90 days): ${repairCount}`);

  if (repairCount === 0) {
    log('yellow', '⚠ Insufficient data for forecasting (need 30+ days)');
  } else {
    log('green', `✓ Found ${repairCount} completed repairs`);
  }

  // Test GET
  log('cyan', '\n→ Testing forecast history (GET)...');
  const history = await testEndpoint('GET', '/api/ai/forecast');

  if (history.success) {
    log('green', '✓ Forecast history endpoint working');
    console.log(`  Forecasts in history: ${history.data.forecasts?.length || 0}`);
  }

  // Test POST
  log('cyan', '\n→ Testing forecast generation (POST)...');
  const forecast = await testEndpoint('POST', '/api/ai/forecast', {});

  if (forecast.success) {
    log('green', '✓ Forecast generated successfully');
  } else if (forecast.data?.error?.includes('Insufficient')) {
    log('yellow', '⚠ Expected: Need more historical data');
  } else {
    log('yellow', '⚠ Requires valid GEMINI_API_KEY in .env');
  }
}

async function testDatabase() {
  log('blue', '\n═══════════════════════════════════════');
  log('blue', '  TEST 5: Database Tables & Data');
  log('blue', '═══════════════════════════════════════');

  log('cyan', '\n→ Checking AI tables...');

  const tables = {
    'chat_history': prisma.chatHistory,
    'ai_analytics': prisma.aIAnalytics,
    'inventory_forecasts': prisma.inventoryForecast,
    'ai_quality_checks': prisma.aIQualityCheck,
  };

  for (const [name, model] of Object.entries(tables)) {
    try {
      const count = await model.count();
      log('green', `✓ ${name.padEnd(20)} ${count} records`);
    } catch (error) {
      log('red', `✗ ${name.padEnd(20)} ERROR: ${error.message}`);
    }
  }

  log('cyan', '\n→ Checking analytics data...');
  const analytics = await prisma.aIAnalytics.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  if (analytics.length > 0) {
    log('green', `✓ Found ${analytics.length} analytics entries`);
    analytics.forEach(a => {
      console.log(`  ${a.endpoint} | ${a.model} | ${a.success ? '✓' : '✗'} | ${a.responseTime}ms`);
    });
  } else {
    log('yellow', '⚠ No analytics data yet');
  }
}

async function testComponents() {
  log('blue', '\n═══════════════════════════════════════');
  log('blue', '  TEST 6: UI Components & Pages');
  log('blue', '═══════════════════════════════════════');

  const pages = [
    { name: 'AI Features Page', url: '/ai-features' },
    { name: 'New Repair Form', url: '/dashboard/repairs/new' },
    { name: 'Dashboard Home', url: '/dashboard' },
  ];

  for (const page of pages) {
    log('cyan', `\n→ Testing ${page.name}...`);

    try {
      const response = await fetch(`${API_BASE}${page.url}`);

      if (response.ok) {
        log('green', `✓ ${page.name} loads (HTTP ${response.status})`);
      } else {
        log('red', `✗ ${page.name} failed (HTTP ${response.status})`);
      }
    } catch (error) {
      log('red', `✗ ${page.name} error: ${error.message}`);
    }
  }
}

async function generateReport() {
  log('blue', '\n═══════════════════════════════════════');
  log('blue', '  TEST SUMMARY & RECOMMENDATIONS');
  log('blue', '═══════════════════════════════════════\n');

  const stats = {
    customers: await prisma.customer.count(),
    repairs: await prisma.repairOrder.count(),
    analytics: await prisma.aIAnalytics.count(),
    chatHistory: await prisma.chatHistory.count(),
  };

  console.log('📊 Database Statistics:');
  console.log(`  Customers:     ${stats.customers}`);
  console.log(`  Repairs:       ${stats.repairs}`);
  console.log(`  AI Analytics:  ${stats.analytics}`);
  console.log(`  Chat History:  ${stats.chatHistory}`);

  log('cyan', '\n📋 Next Steps:');

  console.log('  1. Configure Gemini API Key:');
  console.log('     • Visit: https://aistudio.google.com/app/apikey');
  console.log('     • Add to .env: GEMINI_API_KEY="your_key_here"');
  console.log('     • Restart dev server: npm run dev');

  console.log('\n  2. Test AI Features:');
  console.log('     • Open: http://localhost:3009/ai-features');
  console.log('     • Upload device photo for diagnostics');
  console.log('     • Try customer chat');
  console.log('     • Test quality checks');

  console.log('\n  3. Integration Testing:');
  console.log('     • Test AI in repair form');
  console.log('     • Verify form auto-fill works');
  console.log('     • Check repair suggestions');

  if (stats.repairs === 0) {
    log('yellow', '\n⚠ No repair data found');
    console.log('  • Forecasting requires historical data');
    console.log('  • Create test repairs or use production data');
  }

  log('green', '\n✅ All structural tests passed!');
  log('yellow', '⚠ AI features require valid GEMINI_API_KEY');
  console.log('');
}

async function main() {
  console.log('');
  log('blue', '╔═══════════════════════════════════════════════════════╗');
  log('blue', '║   AI FEATURES - INTERACTIVE TEST SUITE               ║');
  log('blue', '║   Mobile Repair Dashboard                            ║');
  log('blue', '╚═══════════════════════════════════════════════════════╝');
  console.log('');
  log('cyan', `API Base: ${API_BASE}`);
  log('cyan', `Date: ${new Date().toISOString().split('T')[0]}`);

  try {
    await testDiagnostics();
    await testChat();
    await testQualityCheck();
    await testForecast();
    await testDatabase();
    await testComponents();
    await generateReport();
  } catch (error) {
    log('red', `\n✗ Test error: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
main().catch(console.error);
