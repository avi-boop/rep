import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/settings
 * Get current integration and customization settings (masked for security)
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
      customization: {
        companyName: process.env.COMPANY_NAME || '',
        companyPhone: process.env.COMPANY_PHONE || '',
        companyEmail: process.env.COMPANY_EMAIL || '',
        primaryColor: process.env.PRIMARY_COLOR || '#3B82F6',
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
 * Update integration and customization settings in .env file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lightspeedDomainPrefix,
      lightspeedPersonalToken,
      geminiApiKey,
      customization
    } = body;

    const envPath = path.join(process.cwd(), '.env');
    let envContent = await fs.readFile(envPath, 'utf-8');

    // Update or add Lightspeed settings
    if (lightspeedDomainPrefix !== undefined) {
      envContent = updateOrAddEnvVar(envContent, 'LIGHTSPEED_DOMAIN_PREFIX', lightspeedDomainPrefix);
    }

    if (lightspeedPersonalToken !== undefined) {
      envContent = updateOrAddEnvVar(envContent, 'LIGHTSPEED_PERSONAL_TOKEN', lightspeedPersonalToken);
    }

    // Update or add Gemini API key
    if (geminiApiKey !== undefined) {
      envContent = updateOrAddEnvVar(envContent, 'GEMINI_API_KEY', geminiApiKey);
    }

    // Update or add customization settings
    if (customization) {
      if (customization.companyName !== undefined) {
        envContent = updateOrAddEnvVar(envContent, 'COMPANY_NAME', customization.companyName);
      }
      if (customization.companyPhone !== undefined) {
        envContent = updateOrAddEnvVar(envContent, 'COMPANY_PHONE', customization.companyPhone);
      }
      if (customization.companyEmail !== undefined) {
        envContent = updateOrAddEnvVar(envContent, 'COMPANY_EMAIL', customization.companyEmail);
      }
      if (customization.primaryColor !== undefined) {
        envContent = updateOrAddEnvVar(envContent, 'PRIMARY_COLOR', customization.primaryColor);
      }
    }

    // Write back to .env file
    await fs.writeFile(envPath, envContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: customization
        ? 'Settings updated successfully!'
        : 'Settings updated successfully. Please restart the application for changes to take effect.',
    });

  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to update or add an environment variable in .env content
 */
function updateOrAddEnvVar(envContent: string, varName: string, value: string): string {
  const regex = new RegExp(`^${varName}=.*$`, 'm');

  if (regex.test(envContent)) {
    // Update existing variable
    return envContent.replace(regex, `${varName}="${value}"`);
  } else {
    // Add new variable
    const separator = envContent.endsWith('\n') ? '' : '\n';
    return envContent + `${separator}${varName}="${value}"\n`;
  }
}
