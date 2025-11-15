// Force dynamic rendering for database access
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, DollarSign, Wrench, Users } from 'lucide-react'

async function getAnalytics() {
  const [
    totalRevenue,
    totalRepairs,
    totalCustomers,
    recentRepairs,
    popularRepairs,
    revenueByStatus
  ] = await Promise.all([
    prisma.repairOrder.aggregate({
      _sum: { totalPrice: true }
    }),
    prisma.repairOrder.count(),
    prisma.customer.count(),
    prisma.repairOrder.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        deviceModel: { include: { brand: true } }
      }
    }),
    prisma.repairOrderItem.groupBy({
      by: ['repairTypeId'],
      _count: true,
      orderBy: { _count: { repairTypeId: 'desc' } },
      take: 5
    }),
    prisma.repairOrder.groupBy({
      by: ['status'],
      _sum: { totalPrice: true },
      _count: true
    })
  ])

  // Get repair type names
  const repairTypeIds = popularRepairs.map(r => r.repairTypeId)
  const repairTypes = await prisma.repairType.findMany({
    where: { id: { in: repairTypeIds } }
  })

  const popularRepairsWithNames = popularRepairs.map(pr => ({
    ...pr,
    name: repairTypes.find(rt => rt.id === pr.repairTypeId)?.name || 'Unknown'
  }))

  return {
    totalRevenue: totalRevenue._sum.totalPrice || 0,
    totalRepairs,
    totalCustomers,
    recentRepairs,
    popularRepairs: popularRepairsWithNames,
    revenueByStatus
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalytics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Total Repairs"
          value={data.totalRepairs.toString()}
          icon={<Wrench className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Total Customers"
          value={data.totalCustomers.toString()}
          icon={<Users className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(data.totalRevenue / (data.totalRepairs || 1))}
          icon={<TrendingUp className="w-6 h-6" />}
          color="orange"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular Repairs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Most Popular Repairs</h2>
          <div className="space-y-3">
            {data.popularRepairs.map((repair, index) => (
              <div key={repair.repairTypeId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{repair.name}</span>
                </div>
                <span className="text-sm text-gray-600">{repair._count} repairs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue by Status</h2>
          <div className="space-y-3">
            {data.revenueByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">{item._count} orders</span>
                </div>
                <span className="font-medium text-gray-900">
                  {formatCurrency(item._sum.totalPrice || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {data.recentRepairs.map((repair) => (
            <div key={repair.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{repair.orderNumber}</p>
                  <p className="text-sm text-gray-600">
                    {repair.customer.firstName} {repair.customer.lastName} - {repair.deviceModel.brand.name} {repair.deviceModel.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(repair.totalPrice)}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(repair.status)}`}>
                    {repair.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color }: {
  title: string
  value: string
  icon: React.ReactNode
  color: 'green' | 'blue' | 'purple' | 'orange'
}) {
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${colors[color]} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    waiting_parts: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    ready_pickup: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
