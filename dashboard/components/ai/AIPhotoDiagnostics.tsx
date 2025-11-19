'use client';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, X, Camera } from 'lucide-react';

interface Damage {
  type: string;
  severity: 'minor' | 'moderate' | 'severe';
  location: string;
  description: string;
}

interface Diagnosis {
  damages: Damage[];
  overall_condition: string;
  estimated_repair_time: string;
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
}

interface SuggestedRepair {
  type: string;
  priority: string;
  description: string;
  location: string;
}

interface AIPhotoDiagnosticsProps {
  deviceType?: string;
  onDiagnosisComplete?: (diagnosis: Diagnosis, repairs: SuggestedRepair[]) => void;
  onError?: (error: string) => void;
}

export default function AIPhotoDiagnostics({
  deviceType = 'Mobile Device',
  onDiagnosisComplete,
  onError,
}: AIPhotoDiagnosticsProps) {
  const [image, setImage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [suggestedRepairs, setSuggestedRepairs] = useState<SuggestedRepair[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImage(base64.split(',')[1]); // Remove data:image prefix
      setError('');
      setDiagnosis(null);
      setSuggestedRepairs([]);
    };
    reader.readAsDataURL(file);
  };

  const analyzeDamage = async () => {
    if (!image) return;

    setLoading(true);
    setError('');
    setDiagnosis(null);

    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: image,
          device_type: deviceType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setDiagnosis(data.diagnosis);
      setSuggestedRepairs(data.suggested_repairs || []);

      if (onDiagnosisComplete) {
        onDiagnosisComplete(data.diagnosis, data.suggested_repairs || []);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to analyze image';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage('');
    setImagePreview('');
    setDiagnosis(null);
    setSuggestedRepairs([]);
    setError('');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'minor':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 font-semibold';
      case 'medium':
        return 'text-orange-600 font-medium';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="relative group">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="ai-photo-upload"
        />

        {!imagePreview ? (
          <label
            htmlFor="ai-photo-upload"
            className="flex flex-col items-center justify-center w-full h-72 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:border-blue-400 hover:shadow-lg"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 transform group-hover:scale-105 transition-transform duration-300">
              <div className="relative">
                <Camera className="w-16 h-16 text-blue-500 mb-4 group-hover:text-blue-600 transition-colors" />
                <Upload className="w-6 h-6 text-blue-400 absolute -top-1 -right-1 group-hover:animate-bounce" />
              </div>
              <p className="mb-2 text-base text-gray-700">
                <span className="font-bold text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
              <p className="text-xs text-gray-400 mt-2">Upload a photo of the damaged device</p>
            </div>
          </label>
        ) : (
          <div className="relative rounded-xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 pointer-events-none"></div>
            <img
              src={imagePreview}
              alt="Device preview"
              className="w-full max-h-96 object-contain bg-gray-900/5 backdrop-blur-sm"
            />
            {!diagnosis && (
              <button
                onClick={clearImage}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
                title="Remove image"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {!diagnosis && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                <p className="text-sm font-medium">Device: {deviceType}</p>
                <p className="text-xs opacity-90">Ready for AI analysis</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analyze Button */}
      {image && !diagnosis && (
        <button
          onClick={analyzeDamage}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg">Analyzing with AI...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg">Analyze Damage with AI</span>
            </>
          )}
        </button>
      )}

      {/* Loading Progress */}
      {loading && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center animate-spin">
                <Loader2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">AI Analysis in Progress</h4>
              <p className="text-sm text-gray-600">Examining device for damage patterns...</p>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-2/3 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-5 flex items-start gap-4 shadow-md">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-900 text-lg">Analysis Error</h3>
            <p className="text-sm text-red-700 mt-1 leading-relaxed">{error}</p>
            {error.includes('API key') && (
              <p className="text-xs text-red-600 mt-2 bg-red-100 rounded-lg p-2">
                💡 Tip: Make sure GEMINI_API_KEY is configured in your .env file
              </p>
            )}
          </div>
          <button
            onClick={() => setError('')}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Diagnosis Results */}
      {diagnosis && (
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-2xl p-8 space-y-6 shadow-xl animate-[slideIn_0.5s_ease-out]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center animate-[bounce_1s_ease-in-out_2]">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-900">AI Analysis Complete</h3>
              <p className="text-sm text-green-700">Powered by Gemini 2.0</p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-green-300">
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Overall Condition</p>
              <p className="text-base font-bold text-gray-900">{diagnosis.overall_condition}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Estimated Repair Time</p>
              <p className="text-base font-bold text-gray-900">{diagnosis.estimated_repair_time}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Urgency Level</p>
              <p className={`text-base font-bold capitalize ${getUrgencyColor(diagnosis.urgency)}`}>
                {diagnosis.urgency}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">AI Confidence</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-gray-900">
                  {(diagnosis.confidence * 100).toFixed(0)}%
                </p>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${diagnosis.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Detected Issues */}
          {diagnosis.damages.length > 0 && (
            <div className="pt-4 border-t-2 border-green-300">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-bold">
                  {diagnosis.damages.length}
                </span>
                Detected Issues
              </h4>
              <div className="space-y-3">
                {diagnosis.damages.map((damage, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${getSeverityColor(damage.severity)} transition-all hover:scale-[1.02] hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold capitalize text-base">
                        {damage.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs uppercase font-bold px-2 py-1 rounded-full bg-white/50">
                        {damage.severity}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{damage.description}</p>
                    <p className="text-xs font-medium opacity-75 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      Location: {damage.location}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Repairs */}
          {suggestedRepairs.length > 0 && (
            <div className="pt-4 border-t border-green-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Suggested Repairs
              </h4>
              <ul className="space-y-2">
                {suggestedRepairs.map((repair, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span className="text-gray-900">{repair.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-green-200 flex gap-3">
            <button
              onClick={clearImage}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Analyze Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
