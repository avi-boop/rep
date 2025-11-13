import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { formatCurrency } from '@/lib/utils'
import { Wrench, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react'

async function getDashboardStats() {
  const [
    totalRepairs,
    pendingRepairs,
    completedToday,
    totalRevenue
  ] = await Promise.all([
    prisma.repairOrder.count(),
    prisma.repairOrder.count({
      where: {
        status: {
          in: ['pending', 'in_progress', 'waiting_parts']
        }
      }
    }),
    prisma.repairOrder.count({
      where: {
        status: 'completed',
        actualCompletion: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.repairOrder.aggregate({
      _sum: {
        totalPrice: true
      }
    })
  ])

  return {
    totalRepairs,
    pendingRepairs,
    completedToday,
    totalRevenue: totalRevenue._sum.totalPrice || 0
  }
}

async function getRecentRepairs() {
  return prisma.repairOrder.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      customer: true,
      deviceModel: {
        include: {
          brand: true
        }
      }
    }
  })
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const recentRepairs = await getRecentRepairs()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome to your repair shop management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Repairs"
          value={stats.totalRepairs.toString()}
          icon={<Wrench className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Pending Repairs"
          value={stats.pendingRepairs.toString()}
          icon={<Clock className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday.toString()}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Recent Repairs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Repairs</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentRepairs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No repairs yet. Create your first repair order!</p>
            </div>
          ) : (
            recentRepairs.map((repair) => (
              <div key={repair.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {repair.orderNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      {repair.customer.firstName} {repair.customer.lastName} - {repair.deviceModel.brand.name} {repair.deviceModel.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(repair.status)}`}>
                      {repair.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(repair.totalPrice)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickActionCard
          title="New Repair"
          description="Create a new repair order"
          href="/dashboard/repairs/new"
        />
        <QuickActionCard
          title="View All Repairs"
          description="See all repair orders"
          href="/dashboard/repairs"
        />
        <QuickActionCard
          title="Manage Pricing"
          description="Update repair pricing"
          href="/dashboard/pricing"
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: {
  title: string
  value: string
  icon: React.ReactNode
  color: 'blue' | 'yellow' | 'green' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${colorClasses[color]} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({ title, description, href }: {
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
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
