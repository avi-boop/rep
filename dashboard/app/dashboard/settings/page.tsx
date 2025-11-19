'use client'

// Force dynamic rendering for database access
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Settings, ExternalLink, Check, X, Loader2, Sparkles, FileText, Palette, Info, BookOpen } from 'lucide-react';

type TabType = 'integrations' | 'customization' | 'ai-docs';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('integrations');
  const [lightspeedDomainPrefix, setLightspeedDomainPrefix] = useState('');
  const [lightspeedToken, setLightspeedToken] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  // Form customization settings
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [customFields, setCustomFields] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setStatus(data.settings);

      // Load customization settings
      if (data.settings.customization) {
        setCompanyName(data.settings.customization.companyName || '');
        setCompanyPhone(data.settings.customization.companyPhone || '');
        setCompanyEmail(data.settings.customization.companyEmail || '');
        setPrimaryColor(data.settings.customization.primaryColor || '#3B82F6');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveLightspeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lightspeedDomainPrefix,
          lightspeedPersonalToken: lightspeedToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Lightspeed settings saved! Restart required.' });
        await loadSettings();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save Lightspeed settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Gemini AI settings saved! Restart required.' });
        await loadSettings();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save Gemini AI settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customization: {
            companyName,
            companyPhone,
            companyEmail,
            primaryColor,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Customization settings saved successfully!' });
        await loadSettings();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save customization settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure integrations, customize forms, and learn about AI features</p>
      </div>

      {/* Status Messages */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <p>{message.text}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'integrations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Integrations
            </div>
          </button>
          <button
            onClick={() => setActiveTab('customization')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'customization'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Form Customization
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ai-docs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'ai-docs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              AI Features Documentation
            </div>
          </button>
        </nav>
      </div>

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lightspeed POS Integration */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Lightspeed POS Integration</h2>
              {status?.lightspeed?.configured && (
                <span className="ml-auto px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Configured
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Connect to Lightspeed X Series POS to sync customers and pricing automatically.
            </p>

            <form onSubmit={handleSaveLightspeed} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain Prefix
                </label>
                <input
                  type="text"
                  value={lightspeedDomainPrefix}
                  onChange={(e) => setLightspeedDomainPrefix(e.target.value)}
                  placeholder="your-store-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  From your Lightspeed URL: https://<strong>your-store-name</strong>.retail.lightspeed.app
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Access Token
                </label>
                <input
                  type="password"
                  value={lightspeedToken}
                  onChange={(e) => setLightspeedToken(e.target.value)}
                  placeholder="Enter your Personal Access Token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Generate in Setup → Personal Tokens in Lightspeed X Series
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Lightspeed Settings
                </button>
                <a
                  href="https://x-series-api.lightspeedhq.com/docs/authorization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </form>

            {status?.lightspeed?.configured && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">Features Enabled:</p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Sync customers from Lightspeed</li>
                  <li>• Create/update customers in Lightspeed</li>
                  <li>• Sync repair pricing to POS</li>
                </ul>
              </div>
            )}
          </div>

          {/* Gemini AI Integration */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold">Gemini AI Integration</h2>
              {status?.gemini?.configured && (
                <span className="ml-auto px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Configured
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Use Google Gemini AI for intelligent features like photo diagnostics, pricing insights, and customer chat.
            </p>

            <form onSubmit={handleSaveGemini} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from Google AI Studio
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Gemini AI Settings
                </button>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </form>

            {status?.gemini?.configured && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800 font-medium">Features Enabled:</p>
                <ul className="text-sm text-purple-700 mt-2 space-y-1">
                  <li>• AI photo diagnostics</li>
                  <li>• Customer chat assistant</li>
                  <li>• Quality check validation</li>
                  <li>• Pricing recommendations</li>
                </ul>
              </div>
            )}
          </div>

          {/* Restart Application */}
          {(lightspeedDomainPrefix || geminiApiKey) && (
            <div className="lg:col-span-2 bg-yellow-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-yellow-700" />
                <h3 className="font-semibold text-yellow-900">Restart Required</h3>
              </div>
              <p className="text-sm text-yellow-800 mb-4">
                After saving integration settings, restart the application to apply changes:
              </p>
              <code className="block bg-yellow-100 p-3 rounded text-sm text-yellow-900 font-mono">
                pm2 restart dashboard-test
              </code>
            </div>
          )}
        </div>
      )}

      {/* Form Customization Tab */}
      {activeTab === 'customization' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Company Information</h2>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Customize your forms with your company information. These details will appear on repair orders, invoices, and customer communications.
            </p>

            <form onSubmit={handleSaveCustomization} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="The Profit Platform"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="+61 2 1234 5678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="info@theprofitplatform.com.au"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Brand Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-16 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This color will be used for buttons and accents
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Customization Settings
                </button>
              </div>
            </form>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-blue-700" />
              <h3 className="font-semibold text-blue-900">Form Fields Customization</h3>
            </div>
            <p className="text-sm text-blue-800 mb-3">
              These settings allow you to personalize forms throughout the dashboard:
            </p>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• <strong>Company Name:</strong> Appears on repair orders and invoices</li>
              <li>• <strong>Phone & Email:</strong> Contact details shown to customers</li>
              <li>• <strong>Brand Color:</strong> Customizes buttons, links, and UI accents</li>
              <li>• <strong>Custom Fields:</strong> Add additional fields to repair forms (coming soon)</li>
            </ul>
          </div>
        </div>
      )}

      {/* AI Documentation Tab */}
      {activeTab === 'ai-docs' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">AI Features Documentation</h2>
            </div>
            <p className="text-gray-700">
              Learn how to use our AI-powered features to streamline your repair shop operations and provide better customer service.
            </p>
          </div>

          {/* Photo Diagnostics */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Photo Diagnostics</h3>
                <p className="text-sm text-gray-600">Intelligent damage assessment from device photos</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What it does:</h4>
                <p>Analyzes photos of damaged devices to automatically identify:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Type of damage (screen crack, water damage, battery issue, etc.)</li>
                  <li>Severity level (minor, moderate, severe)</li>
                  <li>Affected components</li>
                  <li>Recommended repair actions</li>
                  <li>Estimated repair cost range</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How to use:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Navigate to a repair order details page</li>
                  <li>Upload photos of the damaged device</li>
                  <li>Click "Analyze with AI" button</li>
                  <li>Review the AI diagnosis and recommendations</li>
                  <li>Use insights to create accurate quotes</li>
                </ol>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Best Practices:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-purple-800">
                  <li>Take clear, well-lit photos from multiple angles</li>
                  <li>Include close-ups of damaged areas</li>
                  <li>Capture the entire device for context</li>
                  <li>Always verify AI recommendations with manual inspection</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Customer Chat Widget */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Customer Chat Assistant</h3>
                <p className="text-sm text-gray-600">Intelligent support for customer inquiries</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What it does:</h4>
                <p>Provides instant, intelligent responses to common customer questions about:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Repair pricing and timeframes</li>
                  <li>Device compatibility</li>
                  <li>Warranty information</li>
                  <li>Repair process and status</li>
                  <li>Part quality options</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Features:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>24/7 instant responses</li>
                  <li>Context-aware conversations</li>
                  <li>Integration with your pricing database</li>
                  <li>Seamless handoff to human staff</li>
                  <li>Multi-language support (coming soon)</li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Configuration:</h4>
                <p className="text-blue-800">
                  The chat widget can be customized with your company branding and trained on your specific pricing, policies, and FAQs. Contact support to set up advanced customization.
                </p>
              </div>
            </div>
          </div>

          {/* Quality Check Widget */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Quality Check</h3>
                <p className="text-sm text-gray-600">Automated repair verification and quality assurance</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What it does:</h4>
                <p>Analyzes post-repair photos to verify:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Repair completeness</li>
                  <li>Component alignment</li>
                  <li>Visual quality standards</li>
                  <li>Potential defects or issues</li>
                  <li>Comparison with pre-repair condition</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Quality Checklist:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Screen alignment and fitment</li>
                  <li>No visible gaps or misalignment</li>
                  <li>Clean installation (no dust/debris)</li>
                  <li>Proper cable routing</li>
                  <li>All screws and components secured</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Benefits:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-green-800">
                  <li>Reduce warranty claims</li>
                  <li>Ensure consistent quality</li>
                  <li>Train new technicians</li>
                  <li>Build customer confidence</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pricing Intelligence */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Pricing Intelligence</h3>
                <p className="text-sm text-gray-600">Smart pricing recommendations based on market data</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What it does:</h4>
                <p>Provides data-driven pricing recommendations by analyzing:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Sydney market rates for repairs</li>
                  <li>Competitor pricing trends</li>
                  <li>Part costs and availability</li>
                  <li>Historical pricing data</li>
                  <li>Seasonal demand patterns</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Features:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Real-time market analysis</li>
                  <li>Confidence scores for recommendations</li>
                  <li>Margin optimization suggestions</li>
                  <li>Competitive positioning insights</li>
                  <li>Demand forecasting (coming soon)</li>
                </ul>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 mb-2">Usage Tips:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-indigo-800">
                  <li>Review recommendations weekly for pricing optimization</li>
                  <li>Consider confidence scores when setting prices</li>
                  <li>Balance profitability with market competitiveness</li>
                  <li>Track conversion rates to refine pricing strategy</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started with AI Features</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                  1
                </div>
                <div>
                  <strong>Configure Gemini AI:</strong> Add your Gemini API key in the Integrations tab above
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                  2
                </div>
                <div>
                  <strong>Restart Application:</strong> Run <code className="bg-gray-100 px-2 py-1 rounded">pm2 restart dashboard-test</code> to apply changes
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                  3
                </div>
                <div>
                  <strong>Start Using:</strong> AI features will be automatically available in repair orders, pricing page, and customer interactions
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
