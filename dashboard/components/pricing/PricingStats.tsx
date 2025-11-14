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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Pricing */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 hover:shadow-medium smooth-transition group">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-600">Total Prices</p>
          <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:scale-110 smooth-transition">
            <DollarSign className="text-white" size={20} />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-2">{active}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary-500"></span>
          {active === total ? 'All active' : `${total - active} inactive`}
        </p>
      </div>

      {/* Average Price */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 hover:shadow-medium smooth-transition group">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-600">Average Price</p>
          <div className="p-3 bg-gradient-to-br from-success-500 to-success-600 rounded-xl shadow-lg group-hover:scale-110 smooth-transition">
            <TrendingUp className="text-white" size={20} />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-2">${Math.round(avgPrice)}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success-500"></span>
          Across all repair types
        </p>
      </div>

      {/* Confirmed Prices */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 hover:shadow-medium smooth-transition group">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-600">Confirmed</p>
          <div className="p-3 bg-gradient-to-br from-success-500 to-success-600 rounded-xl shadow-lg group-hover:scale-110 smooth-transition">
            <Check className="text-white" size={20} />
          </div>
        </div>
        <p className="text-3xl font-bold text-success-700 mb-3">{confirmed}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-success-500 to-success-600 h-2.5 rounded-full smooth-transition shadow-sm"
              style={{ width: `${confirmedPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-success-700">{confirmedPercent}%</span>
        </div>
      </div>

      {/* Estimated Prices */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 hover:shadow-medium smooth-transition group">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-600">AI Estimated</p>
          <div className="p-3 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl shadow-lg group-hover:scale-110 smooth-transition">
            <AlertCircle className="text-white" size={20} />
          </div>
        </div>
        <p className="text-3xl font-bold text-warning-700 mb-3">{estimated}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-warning-500 to-warning-600 h-2.5 rounded-full smooth-transition shadow-sm"
              style={{ width: `${estimatedPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-warning-700">{estimatedPercent}%</span>
        </div>
      </div>
    </div>
  )
}
