/**
 * Gemini AI Integration Service
 * Provides intelligent pricing recommendations for repairs in Sydney
 */

interface GeminiConfig {
  apiKey: string;
  apiUrl: string;
}

interface PriceRecommendation {
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  marketAverage: number;
  confidence: number;
  reasoning: string;
  sources: string[];
  lastUpdated: string;
}

export class GeminiAIService {
  private config: GeminiConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      apiKey: process.env.GEMINI_API_KEY || '',
      apiUrl: process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta',
    };
    this.baseUrl = this.config.apiUrl;
  }

  /**
   * Check if Gemini AI is configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Get repair price intelligence for Sydney market
   */
  async getRepairPriceIntelligence(params: {
    deviceBrand: string;
    deviceModel: string;
    repairType: string;
    partQuality?: string;
  }): Promise<PriceRecommendation> {
    if (!this.isConfigured()) {
      throw new Error('Gemini AI not configured. Please add your API key in settings.');
    }

    try {
      const prompt = this.buildPricingPrompt(params);
      const response = await this.callGeminiAPI(prompt);
      return this.parsePricingResponse(response);
    } catch (error) {
      console.error('Error getting Gemini AI price intelligence:', error);
      throw error;
    }
  }

  /**
   * Build the pricing intelligence prompt
   */
  private buildPricingPrompt(params: {
    deviceBrand: string;
    deviceModel: string;
    repairType: string;
    partQuality?: string;
  }): string {
    const { deviceBrand, deviceModel, repairType, partQuality = 'OEM' } = params;

    return `You are a mobile repair pricing expert in Sydney, Australia.

Provide current market pricing for the following repair:
- Device: ${deviceBrand} ${deviceModel}
- Repair Type: ${repairType}
- Part Quality: ${partQuality}
- Location: Sydney, Australia

Please provide:
1. Suggested retail price in AUD
2. Minimum recommended price in AUD
3. Maximum recommended price in AUD
4. Current market average in AUD
5. Confidence level (0-100%)
6. Brief reasoning for the pricing
7. Key factors affecting the price

Format your response as JSON with this structure:
{
  "suggestedPrice": number,
  "minPrice": number,
  "maxPrice": number,
  "marketAverage": number,
  "confidence": number (0-100),
  "reasoning": "string explaining the pricing",
  "factors": ["factor1", "factor2", ...],
  "marketConditions": "brief market analysis"
}

Base your recommendations on:
- Current Sydney market rates (2025)
- Device popularity and availability
- Part availability and costs
- Competition in the area
- Typical repair shop margins (40-60%)
- Consumer expectations

Respond only with the JSON object, no additional text.`;
  }

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.config.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.statusText}. ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        console.error('Gemini API response:', JSON.stringify(data));
        throw new Error('No response from Gemini AI');
      }

      if (!data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error('Unexpected Gemini API response structure:', JSON.stringify(data));
        throw new Error(`Unexpected response structure from Gemini AI. Response: ${JSON.stringify(data).substring(0, 500)}`);
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  /**
   * Parse Gemini AI response into structured recommendation
   */
  private parsePricingResponse(response: string): PriceRecommendation {
    try {
      // Extract JSON from response (sometimes Gemini adds markdown formatting)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini AI');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        suggestedPrice: parsed.suggestedPrice || 0,
        minPrice: parsed.minPrice || 0,
        maxPrice: parsed.maxPrice || 0,
        marketAverage: parsed.marketAverage || 0,
        confidence: parsed.confidence || 70,
        reasoning: parsed.reasoning || parsed.marketConditions || 'AI-generated pricing recommendation',
        sources: parsed.factors || ['Market analysis', 'Historical data', 'Sydney pricing trends'],
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error parsing Gemini AI response:', error);

      // Return fallback recommendation
      return {
        suggestedPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        marketAverage: 0,
        confidence: 0,
        reasoning: 'Failed to parse AI recommendation. Please try again.',
        sources: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get market insights for a specific device or repair category
   */
  async getMarketInsights(category: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gemini AI not configured');
    }

    const prompt = `Provide a brief market insight (2-3 sentences) for ${category} repairs in Sydney, Australia in 2025. Focus on demand, pricing trends, and customer expectations.`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return response.trim();
    } catch (error) {
      console.error('Error getting market insights:', error);
      throw error;
    }
  }

  /**
   * Validate and sanitize API key
   */
  static validateApiKey(apiKey: string): boolean {
    // Gemini API keys typically start with "AIza" and are 39 characters
    return apiKey.startsWith('AIza') && apiKey.length === 39;
  }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService();
