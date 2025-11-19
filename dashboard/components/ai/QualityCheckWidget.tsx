'use client';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, XCircle, Camera } from 'lucide-react';

interface QCIssue {
  category: string;
  severity: 'minor' | 'moderate' | 'critical';
  description: string;
}

interface QCResult {
  overall_result: {
    passed: boolean;
    score: number;
    total_issues: number;
    critical_issues: number;
    moderate_issues: number;
    minor_issues: number;
  };
  photo_analyses: Array<{
    photo_index: number;
    passed: boolean;
    score: number;
    issues: QCIssue[];
  }>;
  recommendations: string[];
  repair_order: {
    id: number;
    order_number: string;
    device: string;
    repair_types: string;
  };
}

interface QualityCheckWidgetProps {
  repairOrderId: number;
  repairType?: string;
  onCheckComplete?: (result: QCResult) => void;
}

export default function QualityCheckWidget({
  repairOrderId,
  repairType,
  onCheckComplete,
}: QualityCheckWidgetProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [result, setResult] = useState<QCResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (photos.length + files.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload valid image files only');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreviews(prev => [...prev, base64]);
        setPhotos(prev => [...prev, base64.split(',')[1]]);
        setError('');
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const runQualityCheck = async () => {
    if (photos.length === 0) {
      setError('Please upload at least one photo');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/ai/quality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repair_order_id: repairOrderId,
          photos,
          repair_type: repairType,
          check_type: 'final',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Quality check failed');
      }

      setResult(data);

      if (onCheckComplete) {
        onCheckComplete(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to perform quality check');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'minor':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">AI Quality Check</h3>
        <p className="text-sm text-blue-800">
          Upload photos of the completed repair for automated quality inspection
        </p>
      </div>

      {/* Photo Upload */}
      {!result && (
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
            id="qc-photo-upload"
            disabled={photos.length >= 5}
          />

          <label
            htmlFor="qc-photo-upload"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${
              photos.length >= 5 ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-blue-300 bg-blue-50 cursor-pointer hover:bg-blue-100'
            } rounded-lg transition-colors`}
          >
            <div className="flex flex-col items-center">
              <Camera className={`w-8 h-8 ${photos.length >= 5 ? 'text-gray-400' : 'text-blue-500'} mb-2`} />
              <p className={`text-sm ${photos.length >= 5 ? 'text-gray-400' : 'text-blue-600'}`}>
                {photos.length >= 5 ? 'Maximum 5 photos' : `Upload photos (${photos.length}/5)`}
              </p>
            </div>
          </label>

          {/* Photo Previews */}
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`QC Photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    Photo {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Run Check Button */}
          {photos.length > 0 && (
            <button
              onClick={runQualityCheck}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running AI Quality Check...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Run Quality Check
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`border-2 rounded-lg p-6 ${
          result.overall_result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {result.overall_result.passed ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
              <h3 className={`text-lg font-semibold ${
                result.overall_result.passed ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.overall_result.passed ? 'Quality Check Passed' : 'Quality Issues Detected'}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Quality Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(result.overall_result.score)}`}>
                {result.overall_result.score.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Issue Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">
                {result.overall_result.critical_issues}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Moderate</p>
              <p className="text-2xl font-bold text-orange-600">
                {result.overall_result.moderate_issues}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Minor</p>
              <p className="text-2xl font-bold text-yellow-600">
                {result.overall_result.minor_issues}
              </p>
            </div>
          </div>

          {/* Photo Analysis Details */}
          {result.photo_analyses.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Photo Analysis</h4>
              <div className="space-y-3">
                {result.photo_analyses.map((analysis) => (
                  <div key={analysis.photo_index} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Photo {analysis.photo_index}</span>
                      <span className={`text-sm font-semibold ${getScoreColor(analysis.score)}`}>
                        Score: {analysis.score.toFixed(0)}
                      </span>
                    </div>
                    {analysis.issues && analysis.issues.length > 0 && (
                      <div className="space-y-1">
                        {analysis.issues.map((issue, idx) => (
                          <div key={idx} className={`text-xs p-2 rounded border ${getSeverityColor(issue.severity)}`}>
                            <span className="font-medium uppercase">{issue.severity}:</span> {issue.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4 mt-4 flex gap-3">
            <button
              onClick={() => {
                setResult(null);
                setPhotos([]);
                setPhotoPreviews([]);
              }}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Check Again
            </button>
            {result.overall_result.passed && (
              <button
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve for Delivery
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
