'use client';

import { useState, useEffect } from 'react';
import { Settings, ExternalLink, Check, X, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [lightspeedAccountId, setLightspeedAccountId] = useState('');
  const [lightspeedToken, setLightspeedToken] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
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
          lightspeedAccountId,
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

  const handleRestartApp = async () => {
    if (confirm('Restart the application to apply settings?')) {
      setMessage({ type: 'success', text: 'Restarting application...' });
      // User will need to manually restart PM2
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Please run: pm2 restart repair-dashboard' });
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings & Integrations</h1>
        <p className="text-gray-600 mt-1">Configure API integrations and application settings</p>
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
            Connect to Lightspeed POS to sync customers and pricing automatically.
          </p>

          <form onSubmit={handleSaveLightspeed} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account ID
              </label>
              <input
                type="text"
                value={lightspeedAccountId}
                onChange={(e) => setLightspeedAccountId(e.target.value)}
                placeholder="Enter your Lightspeed Account ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in your Lightspeed account settings
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate a personal token in Lightspeed
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
                href="https://www.lightspeedhq.com/pos/retail/"
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
            <Settings className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Gemini AI Pricing Intelligence</h2>
            {status?.gemini?.configured && (
              <span className="ml-auto px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Configured
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Use Google Gemini AI to get intelligent pricing recommendations for Sydney market.
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                <li>• AI-powered pricing recommendations</li>
                <li>• Sydney market analysis</li>
                <li>• Competitive pricing insights</li>
                <li>• Confidence scoring</li>
              </ul>
            </div>
          )}
        </div>

        {/* Restart Application */}
        {(lightspeedAccountId || geminiApiKey) && (
          <div className="lg:col-span-2 bg-yellow-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-yellow-700" />
              <h3 className="font-semibold text-yellow-900">Restart Required</h3>
            </div>
            <p className="text-sm text-yellow-800 mb-4">
              After saving new settings, restart the application to apply changes:
            </p>
            <code className="block bg-yellow-100 p-3 rounded text-sm text-yellow-900">
              pm2 restart repair-dashboard
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
