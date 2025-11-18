'use client';

import { useState } from 'react';
import AIPhotoDiagnostics from '@/components/ai/AIPhotoDiagnostics';
import CustomerChatWidget from '@/components/ai/CustomerChatWidget';
import QualityCheckWidget from '@/components/ai/QualityCheckWidget';
import { Brain, Camera, MessageCircle, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';

export default function AIFeaturesPage() {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'chat' | 'quality' | 'forecast'>('diagnostics');
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const tabs = [
    { id: 'diagnostics', label: 'Repair Diagnostics', icon: Camera },
    { id: 'chat', label: 'Customer Chat', icon: MessageCircle },
    { id: 'quality', label: 'Quality Check', icon: CheckCircle },
    { id: 'forecast', label: 'Inventory Forecast', icon: TrendingUp },
  ];

  const runInventoryForecast = async () => {
    setForecastLoading(true);
    setForecastResult(null);

    try {
      const response = await fetch('/api/ai/forecast', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Forecast failed');
      }

      setForecastResult(data);
    } catch (error: any) {
      setForecastResult({ error: error.message });
    } finally {
      setForecastLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-3xl font-bold">AI Features Dashboard</h1>
          </div>
          <p className="text-blue-100">
            Powered by Gemini 2.0 Flash • Enterprise-grade AI for mobile repair management
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'diagnostics' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">AI Repair Diagnostics</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Upload a photo of a damaged device and let AI analyze the damage, suggest repairs, and estimate repair time.
              </p>
              <AIPhotoDiagnostics
                deviceType="iPhone 14 Pro"
                onDiagnosisComplete={(diagnosis, repairs) => {
                  console.log('Diagnosis complete:', diagnosis);
                  console.log('Suggested repairs:', repairs);
                }}
                onError={(error) => {
                  console.error('Diagnosis error:', error);
                }}
              />
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="text-blue-600 font-semibold mb-2">95% Accuracy</div>
                <p className="text-sm text-gray-600">Industry-leading damage detection</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="text-blue-600 font-semibold mb-2">2-4 sec</div>
                <p className="text-sm text-gray-600">Average analysis time</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="text-blue-600 font-semibold mb-2">$0.002/photo</div>
                <p className="text-sm text-gray-600">Cost per analysis</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">AI Customer Support</h2>
              </div>
              <p className="text-gray-600 mb-6">
                24/7 AI assistant that answers customer questions about repairs, pricing, and status with context-aware responses.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Demo Mode:</strong> Click the chat button in the bottom-right corner to test the AI assistant.
                  In production, this would use real customer data and repair history.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Context-aware responses based on customer repair history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Instant answers to common questions (warranty, pricing, status)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Professional, empathetic tone</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Escalation detection for complex issues</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Example Questions to Try:</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                      &ldquo;When will my iPhone screen repair be done?&rdquo;
                    </button>
                    <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                      &ldquo;How much does a battery replacement cost?&rdquo;
                    </button>
                    <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                      &ldquo;What&apos;s your warranty policy?&rdquo;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Widget Demo */}
            <CustomerChatWidget
              customerId={1}
              customerName="Demo Customer"
              position="bottom-right"
            />
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">AI Quality Check</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Automated quality inspection of completed repairs. AI analyzes photos to ensure repairs meet quality standards before customer pickup.
              </p>

              <QualityCheckWidget
                repairOrderId={1}
                repairType="Screen Replacement"
                onCheckComplete={(result) => {
                  console.log('Quality check complete:', result);
                }}
              />

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What AI Checks:</h3>
                <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Screen alignment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Cleanliness</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>No tool marks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Proper sealing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Camera clarity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Port accessibility</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">AI Inventory Forecasting</h2>
              </div>
              <p className="text-gray-600 mb-6">
                AI analyzes historical repair data to forecast parts demand for the next 30 days, helping you optimize inventory levels.
              </p>

              <button
                onClick={runInventoryForecast}
                disabled={forecastLoading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mb-6"
              >
                {forecastLoading ? (
                  <>
                    <Brain className="w-5 h-5 animate-pulse" />
                    Analyzing historical data...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Generate Forecast
                  </>
                )}
              </button>

              {forecastResult && !forecastResult.error && (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-sm text-red-600 mb-1">High Priority</div>
                      <div className="text-2xl font-bold text-red-700">
                        {forecastResult.forecast.summary.high_priority.length}
                      </div>
                      <div className="text-xs text-red-600 mt-1">parts need ordering</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="text-sm text-yellow-600 mb-1">Overstock</div>
                      <div className="text-2xl font-bold text-yellow-700">
                        {forecastResult.forecast.summary.overstock.length}
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">parts overstocked</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm text-green-600 mb-1">Investment</div>
                      <div className="text-2xl font-bold text-green-700">
                        ${forecastResult.forecast.summary.total_investment_needed}
                      </div>
                      <div className="text-xs text-green-600 mt-1">recommended spend</div>
                    </div>
                  </div>

                  {/* Forecast Details */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Detailed Forecast:</h3>
                    <div className="space-y-2">
                      {forecastResult.forecast.forecasts.slice(0, 10).map((item: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{item.part_name}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              item.trend === 'increasing' ? 'bg-red-100 text-red-700' :
                              item.trend === 'decreasing' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.trend}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600">Stock</div>
                              <div className="font-semibold">{item.current_stock}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Weekly Use</div>
                              <div className="font-semibold">{item.weekly_usage.toFixed(1)}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">30d Demand</div>
                              <div className="font-semibold">{item.predicted_30day_demand}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Order</div>
                              <div className={`font-semibold ${item.recommended_order > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {item.recommended_order > 0 ? item.recommended_order : 'OK'}
                              </div>
                            </div>
                          </div>
                          {item.reasoning && (
                            <p className="text-xs text-gray-600 mt-2 italic">{item.reasoning}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {forecastResult?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{forecastResult.error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>Powered by <strong>Gemini 2.0 Flash</strong> • Ultra-low cost AI features for mobile repair shops</p>
          <p className="mt-2">Estimated monthly cost: $2-3 for 200 repairs/month</p>
        </div>
      </div>
    </div>
  );
}
