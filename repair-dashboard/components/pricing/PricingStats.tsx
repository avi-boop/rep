import { DollarSign, Check, AlertCircle, TrendingUp } from 'lucide-react'

interface PricingStatsProps {
  total: number
  active: number
  estimated: number
  avgPrice: number
}

export function PricingStats({ total, active, estimated, avgPrice }: PricingStatsProps) {
  const confirmed = active - estimated
  const estimatedPercent = active > 0 ? Math.round((estimated / active) * 100) : 0
  const confirmedPercent = active > 0 ? Math.round((confirmed / active) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Pricing */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <DollarSign className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Prices</p>
            <p className="text-2xl font-bold text-gray-900">{active}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {active === total ? 'All active' : `${total - active} inactive`}
        </p>
      </div>

      {/* Average Price */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Price</p>
            <p className="text-2xl font-bold text-gray-900">${Math.round(avgPrice)}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Across all repair types
        </p>
      </div>

      {/* Confirmed Prices */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Check className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{confirmed}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${confirmedPercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{confirmedPercent}%</span>
        </div>
      </div>

      {/* Estimated Prices */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-100 rounded-lg">
            <AlertCircle className="text-orange-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">AI Estimated</p>
            <p className="text-2xl font-bold text-orange-600">{estimated}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${estimatedPercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{estimatedPercent}%</span>
        </div>
      </div>
    </div>
  )
}
