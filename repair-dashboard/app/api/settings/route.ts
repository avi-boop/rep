import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/settings
 * Get current integration settings (masked for security)
 */
export async function GET(request: NextRequest) {
  try {
    const settings = {
      lightspeed: {
        configured: !!(process.env.LIGHTSPEED_DOMAIN_PREFIX && process.env.LIGHTSPEED_PERSONAL_TOKEN),
        domainPrefix: process.env.LIGHTSPEED_DOMAIN_PREFIX || null,
      },
      gemini: {
        configured: !!process.env.GEMINI_API_KEY,
        apiKey: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.slice(0, 10) + '***' : null,
      },
    };

    return NextResponse.json({ settings });

  } catch (error: any) {
    console.error('Error getting settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings
 * Update integration settings in .env file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lightspeedDomainPrefix, lightspeedPersonalToken, geminiApiKey } = body;

    const envPath = path.join(process.cwd(), '.env');
    let envContent = await fs.readFile(envPath, 'utf-8');

    // Update or add Lightspeed settings
    if (lightspeedDomainPrefix !== undefined) {
      if (envContent.includes('LIGHTSPEED_DOMAIN_PREFIX=')) {
        envContent = envContent.replace(
          /LIGHTSPEED_DOMAIN_PREFIX=.*/,
          `LIGHTSPEED_DOMAIN_PREFIX="${lightspeedDomainPrefix}"`
        );
      } else {
        envContent += `\nLIGHTSPEED_DOMAIN_PREFIX="${lightspeedDomainPrefix}"`;
      }
    }

    if (lightspeedPersonalToken !== undefined) {
      if (envContent.includes('LIGHTSPEED_PERSONAL_TOKEN=')) {
        envContent = envContent.replace(
          /LIGHTSPEED_PERSONAL_TOKEN=.*/,
          `LIGHTSPEED_PERSONAL_TOKEN="${lightspeedPersonalToken}"`
        );
      } else {
        envContent += `\nLIGHTSPEED_PERSONAL_TOKEN="${lightspeedPersonalToken}"`;
      }
    }

    // Update or add Gemini API key
    if (geminiApiKey !== undefined) {
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(
          /GEMINI_API_KEY=.*/,
          `GEMINI_API_KEY="${geminiApiKey}"`
        );
      } else {
        envContent += `\nGEMINI_API_KEY="${geminiApiKey}"`;
      }
    }

    // Write back to .env file
    await fs.writeFile(envPath, envContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully. Please restart the application for changes to take effect.',
    });

  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
