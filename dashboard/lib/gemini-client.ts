import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Model instances
export const geminiModels = {
  flash: genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }),
  flashThinking: genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-thinking-exp-1219'
  }),
  pro: genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }),
};

// Type definitions
export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    model: string;
    tokensUsed?: number;
    responseTime: number;
    confidence?: number;
  };
}

export interface DiagnosisResult {
  damages: Array<{
    type: 'screen_crack' | 'water_damage' | 'dent' | 'scratch' | 'port_damage' | 'button_damage' | 'other';
    severity: 'minor' | 'moderate' | 'severe';
    location: string;
    description: string;
  }>;
  overall_condition: string;
  estimated_repair_time: string;
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface QualityCheckResult {
  passed: boolean;
  score: number;
  issues: Array<{
    category: string;
    severity: 'minor' | 'moderate' | 'critical';
    description: string;
  }>;
  recommendations: string[];
}

export interface InventoryForecast {
  forecasts: Array<{
    part_id: string;
    part_name: string;
    current_stock: number;
    weekly_usage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    predicted_30day_demand: number;
    recommended_order: number;
    confidence: number;
    reasoning: string;
  }>;
  summary: {
    high_priority: string[];
    overstock: string[];
    total_investment_needed: number;
  };
}

// Helper: Retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') ||
                          error.message?.includes('quota') ||
                          error.message?.includes('rate limit');

      if (isRateLimit && i < retries - 1) {
        const backoffDelay = delay * Math.pow(2, i);
        console.log(`Rate limited, retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Helper: Generate text
export async function generateText(
  prompt: string,
  model: 'flash' | 'flashThinking' | 'pro' = 'flash'
): Promise<AIResponse<string>> {
  const startTime = Date.now();

  try {
    const result = await withRetry(async () => {
      return await geminiModels[model].generateContent(prompt);
    });

    const responseTime = Date.now() - startTime;
    const text = result.response.text();

    return {
      success: true,
      data: text,
      metadata: {
        model: model === 'flash' ? 'gemini-2.0-flash-exp' :
               model === 'flashThinking' ? 'gemini-2.0-flash-thinking-exp-1219' :
               'gemini-1.5-pro',
        responseTime,
      },
    };
  } catch (error: any) {
    console.error('Gemini generateText error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate text',
      metadata: {
        model: model,
        responseTime: Date.now() - startTime,
      },
    };
  }
}

// Helper: Analyze image with vision
export async function analyzeImage(
  imageBase64: string,
  prompt: string,
  model: 'flash' | 'flashThinking' = 'flash'
): Promise<AIResponse<string>> {
  const startTime = Date.now();

  try {
    // Validate image data
    if (!imageBase64 || imageBase64.length === 0) {
      throw new Error('Invalid image data');
    }

    const result = await withRetry(async () => {
      return await geminiModels[model].generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
      ]);
    });

    const responseTime = Date.now() - startTime;
    const text = result.response.text();

    return {
      success: true,
      data: text,
      metadata: {
        model: model === 'flash' ? 'gemini-2.0-flash-exp' : 'gemini-2.0-flash-thinking-exp-1219',
        responseTime,
      },
    };
  } catch (error: any) {
    console.error('Gemini analyzeImage error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze image',
      metadata: {
        model: model,
        responseTime: Date.now() - startTime,
      },
    };
  }
}

// Helper: Generate structured JSON
export async function generateJSON<T = any>(
  prompt: string,
  schema?: any,
  model: 'flash' | 'pro' = 'flash'
): Promise<AIResponse<T>> {
  const startTime = Date.now();

  try {
    const generationConfig: any = {
      responseMimeType: 'application/json',
    };

    if (schema) {
      generationConfig.responseSchema = schema;
    }

    const modelInstance = genAI.getGenerativeModel({
      model: model === 'flash' ? 'gemini-2.0-flash-exp' : 'gemini-1.5-pro',
      generationConfig,
    });

    const result = await withRetry(async () => {
      return await modelInstance.generateContent(prompt);
    });

    const responseTime = Date.now() - startTime;
    const text = result.response.text();

    // Parse JSON
    let parsed: T;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
                        text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from response');
      }
      parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }

    return {
      success: true,
      data: parsed,
      metadata: {
        model: model === 'flash' ? 'gemini-2.0-flash-exp' : 'gemini-1.5-pro',
        responseTime,
      },
    };
  } catch (error: any) {
    console.error('Gemini generateJSON error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate JSON',
      metadata: {
        model: model,
        responseTime: Date.now() - startTime,
      },
    };
  }
}

// Helper: Analyze image and return structured JSON
export async function analyzeImageJSON<T = any>(
  imageBase64: string,
  prompt: string,
  schema?: any,
  model: 'flash' = 'flash'
): Promise<AIResponse<T>> {
  const startTime = Date.now();

  try {
    const generationConfig: any = {
      responseMimeType: 'application/json',
    };

    if (schema) {
      generationConfig.responseSchema = schema;
    }

    const modelInstance = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig,
    });

    const result = await withRetry(async () => {
      return await modelInstance.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
      ]);
    });

    const responseTime = Date.now() - startTime;
    const text = result.response.text();

    // Parse JSON
    let parsed: T;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
                        text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from response');
      }
      parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }

    return {
      success: true,
      data: parsed,
      metadata: {
        model: 'gemini-2.0-flash-exp',
        responseTime,
      },
    };
  } catch (error: any) {
    console.error('Gemini analyzeImageJSON error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze image as JSON',
      metadata: {
        model: 'gemini-2.0-flash-exp',
        responseTime: Date.now() - startTime,
      },
    };
  }
}

// Specialized: Diagnose repair from photo
export async function diagnoseRepair(
  imageBase64: string,
  deviceType: string
): Promise<AIResponse<DiagnosisResult>> {
  const schema = {
    type: 'object',
    properties: {
      damages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            severity: { type: 'string' },
            location: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['type', 'severity', 'location', 'description'],
        },
      },
      overall_condition: { type: 'string' },
      estimated_repair_time: { type: 'string' },
      urgency: { type: 'string' },
      confidence: { type: 'number' },
    },
    required: ['damages', 'overall_condition', 'estimated_repair_time', 'urgency', 'confidence'],
  };

  const prompt = `Analyze this ${deviceType} device photo for damage and repair needs.

Identify ALL visible issues:
- Screen condition (cracks, scratches, dead pixels, discoloration)
- Body damage (dents, scratches, bends, discoloration)
- Ports and buttons (damage, debris, misalignment)
- Water damage indicators (corrosion, staining)
- Camera and sensors (cracks, scratches, debris)
- Any other visible defects

For each damage found, specify:
1. Type: screen_crack, water_damage, dent, scratch, port_damage, button_damage, or other
2. Severity: minor (cosmetic), moderate (functional impact), severe (major repair needed)
3. Location: precise location on device (e.g., "top right corner", "charging port", "back panel center")
4. Description: detailed explanation of the issue

Also assess:
- Overall condition: comprehensive assessment
- Estimated repair time: realistic time estimate (e.g., "1-2 hours", "30 minutes")
- Urgency: low (cosmetic only), medium (functional but not critical), high (device unusable/at risk)
- Confidence: your confidence level in this analysis (0.0 to 1.0)

Be thorough and professional. If the image is unclear, note it in your confidence score.`;

  return await analyzeImageJSON<DiagnosisResult>(imageBase64, prompt, schema);
}

// Specialized: Quality check repair photos
export async function qualityCheckRepair(
  photoBase64: string,
  repairType: string
): Promise<AIResponse<QualityCheckResult>> {
  const schema = {
    type: 'object',
    properties: {
      passed: { type: 'boolean' },
      score: { type: 'number' },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            severity: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['category', 'severity', 'description'],
        },
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['passed', 'score', 'issues', 'recommendations'],
  };

  const prompt = `Quality control inspection for completed ${repairType} mobile device repair.

Inspect the following quality criteria:

1. SCREEN ALIGNMENT (if screen repair)
   - No gaps between screen and body
   - Flush alignment on all sides
   - Uniform bezel spacing

2. CLEANLINESS
   - No dust particles under screen
   - No fingerprints or smudges
   - No adhesive residue visible

3. SCREEN PROTECTOR (if applicable)
   - Properly centered and aligned
   - No air bubbles
   - No dust underneath

4. PHYSICAL DAMAGE
   - No new scratches from repair
   - No dents or marks from tools
   - Original condition preserved

5. CAMERA & SENSORS
   - Lenses clean and clear
   - Proper alignment
   - No debris or dust

6. PORTS & BUTTONS
   - All accessible and aligned
   - No obstructions
   - Proper fit

7. CASE CLOSURE
   - Device properly sealed
   - All clips engaged
   - No gaps or misalignment

Rate the repair quality:
- Score: 0-100 (100 = perfect, 90+ = excellent, 80-89 = good, 70-79 = acceptable, <70 = needs rework)
- Passed: true if score >= 80, false otherwise
- Issues: list any problems found with category, severity (minor/moderate/critical), and description
- Recommendations: actionable steps to fix issues

Be strict but fair. Customer satisfaction depends on quality.`;

  return await analyzeImageJSON<QualityCheckResult>(photoBase64, prompt, schema);
}

// Specialized: Generate customer chat response
export async function generateChatResponse(
  customerContext: {
    name: string;
    repairHistory: any[];
    activeRepairs: any[];
  },
  message: string
): Promise<AIResponse<string>> {
  const prompt = `You are a helpful, professional customer service assistant for a mobile device repair shop.

CUSTOMER INFORMATION:
Name: ${customerContext.name}
Active Repairs: ${customerContext.activeRepairs.length}
Total Past Repairs: ${customerContext.repairHistory.length}

${customerContext.activeRepairs.length > 0 ? `
CURRENT REPAIRS:
${customerContext.activeRepairs.map(r => `- ${r.deviceType} ${r.deviceModel}: ${r.repairType} (Status: ${r.status}, Started: ${new Date(r.createdAt).toLocaleDateString()})`).join('\n')}
` : ''}

${customerContext.repairHistory.length > 0 ? `
REPAIR HISTORY:
${customerContext.repairHistory.slice(0, 3).map(r => `- ${r.deviceType}: ${r.repairType} - $${r.totalCost} (${new Date(r.createdAt).toLocaleDateString()})`).join('\n')}
` : ''}

SHOP POLICIES & INFO:
- Warranty: 90 days on all repairs
- Business Hours: Monday-Friday 9am-6pm, Saturday 10am-4pm, Sunday closed
- Average screen repair time: 1-2 hours
- Average battery replacement: 30-45 minutes
- Water damage assessment: 30 minutes (free)
- We offer same-day service for most repairs
- Payment accepted: Cash, Card, Apple Pay, Google Pay

TONE & STYLE:
- Be warm, friendly, and professional
- Show empathy and understanding
- Provide specific, helpful information
- If you don't know something, say so honestly
- Keep responses concise (2-3 sentences usually)
- Use the customer's name occasionally

CUSTOMER QUESTION:
${message}

Provide a helpful, accurate response:`;

  return await generateText(prompt, 'flash');
}

// Specialized: Forecast inventory needs
export async function forecastInventory(
  historicalData: any[]
): Promise<AIResponse<InventoryForecast>> {
  const schema = {
    type: 'object',
    properties: {
      forecasts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            part_id: { type: 'string' },
            part_name: { type: 'string' },
            current_stock: { type: 'number' },
            weekly_usage: { type: 'number' },
            trend: { type: 'string' },
            predicted_30day_demand: { type: 'number' },
            recommended_order: { type: 'number' },
            confidence: { type: 'number' },
            reasoning: { type: 'string' },
          },
        },
      },
      summary: {
        type: 'object',
        properties: {
          high_priority: { type: 'array', items: { type: 'string' } },
          overstock: { type: 'array', items: { type: 'string' } },
          total_investment_needed: { type: 'number' },
        },
      },
    },
  };

  const prompt = `Analyze repair shop inventory and forecast parts demand for next 30 days.

HISTORICAL REPAIR DATA (Last 90 days):
${JSON.stringify(historicalData, null, 2)}

ANALYSIS REQUIRED:

For each part type:
1. Calculate average weekly usage (last 8-12 weeks)
2. Identify trend: increasing (>10% growth), decreasing (>10% decline), or stable
3. Predict 30-day demand considering:
   - Historical patterns
   - Seasonal factors (holidays, back-to-school, etc.)
   - Device popularity trends
   - Recent changes in usage rate
4. Recommend reorder quantity:
   - Formula: (predicted_demand + safety_stock) - current_stock
   - Safety stock = 2 weeks of average usage
   - Minimum order: 5 units (if needed)
5. Confidence level (0.0-1.0) based on data consistency

SUMMARY:
- High priority: parts that need immediate ordering (stock will run out in <2 weeks)
- Overstock: parts with >8 weeks of inventory
- Total investment: sum of recommended orders × average part cost

Be data-driven and practical. Account for real-world constraints like minimum order quantities and lead times.`;

  return await generateJSON<InventoryForecast>(prompt, schema, 'flash');
}

// Export AI client for advanced usage
export { genAI };
