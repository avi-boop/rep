'use client'

import { useState, useEffect } from 'react'
import { Users, AlertTriangle, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string | null
  phone: string
  repairCount: number
  score: number
  scoreBreakdown: {
    dataCompleteness: number
    activityLevel: number
    dataQuality: number
    recency: number
  }
}

interface DuplicateGroup {
  id: string
  detectionMethod: 'phone' | 'email' | 'name' | 'multi'
  confidence: number
  customers: Customer[]
  primaryCustomerId: number
  reason: string
}

interface Report {
  timestamp: string
  summary: {
    totalDuplicateGroups: number
    totalCustomersInDuplicates: number
    byConfidence: {
      high: number
      medium: number
      low: number
    }
    byDetectionMethod: {
      phone: number
      email: number
      name: number
    }
  }
  groups: DuplicateGroup[]
}

export default function CustomerDuplicatesPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [minConfidence, setMinConfidence] = useState(70)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [mergingGroups, setMergingGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadDuplicates()
  }, [minConfidence])

  async function loadDuplicates() {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers/duplicates?minConfidence=${minConfidence}`)
      const data = await response.json()

      if (response.ok) {
        setReport(data)
      } else {
        console.error('Error loading duplicates:', data.error)
        setReport(null)
      }
    } catch (error) {
      console.error('Error loading duplicates:', error)
    } finally {
      setLoading(false)
    }
  }

  async function runAnalysis() {
    setAnalyzing(true)
    const loadingToast = toast.loading('Analyzing customers for duplicates...')

    try {
      const response = await fetch('/api/customers/duplicates', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Analysis completed!', { id: loadingToast })
        await loadDuplicates()
      } else {
        toast.error(data.error || 'Analysis failed', { id: loadingToast })
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to run analysis', { id: loadingToast })
    } finally {
      setAnalyzing(false)
    }
  }

  async function mergeGroup(groupId: string, dryRun: boolean = true) {
    setMergingGroups(prev => new Set(prev).add(groupId))
    const loadingToast = toast.loading(dryRun ? 'Previewing merge...' : 'Merging customers...')

    try {
      const response = await fetch(`/api/customers/duplicates/${encodeURIComponent(groupId)}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun })
      })

      const data = await response.json()

      if (response.ok) {
        const message = dryRun
          ? `Preview: Would merge ${data.mergedCustomerIds.length} customer(s) into #${data.primaryCustomerId}`
          : `Successfully merged ${data.mergedCustomerIds.length} customer(s) into #${data.primaryCustomerId}`

        toast.success(message, { id: loadingToast })

        if (!dryRun) {
          // Reload duplicates after successful merge
          await loadDuplicates()
        }
      } else {
        toast.error(data.error || 'Merge failed', { id: loadingToast })
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to merge', { id: loadingToast })
    } finally {
      setMergingGroups(prev => {
        const next = new Set(prev)
        next.delete(groupId)
        return next
      })
    }
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  function getConfidenceBadgeColor(confidence: number): string {
    if (confidence >= 95) return 'bg-green-100 text-green-800 border-green-300'
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-red-100 text-red-800 border-red-300'
  }

  function getMethodBadgeColor(method: string): string {
    switch (method) {
      case 'phone': return 'bg-blue-100 text-blue-800'
      case 'email': return 'bg-purple-100 text-purple-800'
      case 'name': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Customer Duplicate Management
              </h1>
              <p className="text-gray-600 mt-2">
                Identify and merge duplicate customer records to maintain data integrity
              </p>
            </div>

            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Run Analysis
                </>
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Confidence Level: {minConfidence}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="text-sm font-medium text-gray-600">Total Groups</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {report.summary.totalDuplicateGroups}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="text-sm font-medium text-gray-600">Customers in Duplicates</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {report.summary.totalCustomersInDuplicates}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="text-sm font-medium text-gray-600">High Confidence</div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                {report.summary.byConfidence.high}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="text-sm font-medium text-gray-600">Medium Confidence</div>
              <div className="text-3xl font-bold text-yellow-600 mt-2">
                {report.summary.byConfidence.medium}
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Groups */}
        {!report || report.groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Duplicates Found
            </h3>
            <p className="text-gray-600">
              {report
                ? `No duplicate customers found with confidence ≥${minConfidence}%`
                : 'Run an analysis to find duplicate customers'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {report.groups.map((group) => {
              const isExpanded = expandedGroups.has(group.id)
              const isMerging = mergingGroups.has(group.id)
              const primary = group.customers.find(c => c.id === group.primaryCustomerId)
              const secondaries = group.customers.filter(c => c.id !== group.primaryCustomerId)

              return (
                <div
                  key={group.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Group Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {group.customers.length} Duplicate Customers
                          </h3>

                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceBadgeColor(group.confidence)}`}>
                            {group.confidence}% Confidence
                          </span>

                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMethodBadgeColor(group.detectionMethod)}`}>
                            {group.detectionMethod.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600">{group.reason}</p>

                        {primary && (
                          <div className="mt-3 text-sm">
                            <span className="font-medium text-gray-700">Primary: </span>
                            <span className="text-gray-900">
                              {primary.firstName} {primary.lastName} ({primary.phone})
                              {primary.email && ` - ${primary.email}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            mergeGroup(group.id, true)
                          }}
                          disabled={isMerging}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                        >
                          Preview
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Are you sure you want to merge these customers? This action cannot be easily undone.')) {
                              mergeGroup(group.id, false)
                            }
                          }}
                          disabled={isMerging}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isMerging ? 'Merging...' : 'Merge Now'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <div className="space-y-4">
                        {group.customers.map((customer) => {
                          const isPrimary = customer.id === group.primaryCustomerId

                          return (
                            <div
                              key={customer.id}
                              className={`p-4 rounded-lg border-2 ${
                                isPrimary
                                  ? 'bg-green-50 border-green-300'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900">
                                      #{customer.id} - {customer.firstName} {customer.lastName}
                                    </h4>
                                    {isPrimary && (
                                      <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                        PRIMARY
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-1 text-sm text-gray-600">
                                    <div>
                                      <span className="font-medium">Phone:</span> {customer.phone}
                                    </div>
                                    {customer.email && (
                                      <div>
                                        <span className="font-medium">Email:</span> {customer.email}
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-medium">Repairs:</span> {customer.repairCount}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-2xl font-bold text-gray-900 mb-1">
                                    {customer.score}
                                  </div>
                                  <div className="text-xs text-gray-500">Quality Score</div>
                                </div>
                              </div>

                              {/* Score Breakdown */}
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                <div className="bg-white rounded p-2 text-center">
                                  <div className="font-semibold text-gray-900">
                                    {customer.scoreBreakdown.dataCompleteness}
                                  </div>
                                  <div className="text-gray-500">Completeness</div>
                                </div>
                                <div className="bg-white rounded p-2 text-center">
                                  <div className="font-semibold text-gray-900">
                                    {customer.scoreBreakdown.activityLevel}
                                  </div>
                                  <div className="text-gray-500">Activity</div>
                                </div>
                                <div className="bg-white rounded p-2 text-center">
                                  <div className="font-semibold text-gray-900">
                                    {customer.scoreBreakdown.dataQuality}
                                  </div>
                                  <div className="text-gray-500">Quality</div>
                                </div>
                                <div className="bg-white rounded p-2 text-center">
                                  <div className="font-semibold text-gray-900">
                                    {customer.scoreBreakdown.recency}
                                  </div>
                                  <div className="text-gray-500">Recency</div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
