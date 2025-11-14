import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { formatCurrency } from '@/lib/utils'
import { Wrench, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp, ArrowUpRight } from 'lucide-react'

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Monitor your repair shop performance</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-success-50 border border-success-200 rounded-xl">
          <TrendingUp className="h-4 w-4 text-success-600" />
          <span className="text-sm font-medium text-success-700">+12% this week</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Repairs"
          value={stats.totalRepairs.toString()}
          icon={<Wrench className="h-6 w-6" />}
          color="blue"
          trend="+8%"
        />
        <StatCard
          title="Pending Repairs"
          value={stats.pendingRepairs.toString()}
          icon={<Clock className="h-6 w-6" />}
          color="yellow"
          trend="+3"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday.toString()}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
          trend="+15%"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="h-6 w-6" />}
          color="purple"
          trend="+12%"
        />
      </div>

      {/* Recent Repairs */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-medium smooth-transition">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Repairs</h2>
              <p className="text-sm text-gray-600 mt-0.5">Latest repair orders</p>
            </div>
            <a
              href="/dashboard/repairs"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 smooth-transition"
            >
              View all
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {recentRepairs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium">No repairs yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first repair order to get started!</p>
            </div>
          ) : (
            recentRepairs.map((repair) => (
              <div key={repair.id} className="p-4 hover:bg-gray-50 smooth-transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-primary-500/30">
                      {repair.orderNumber.slice(-2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {repair.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {repair.customer.firstName} {repair.customer.lastName} - {repair.deviceModel.brand.name} {repair.deviceModel.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(repair.status)}`}>
                        {repair.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {formatCurrency(repair.totalPrice)}
                      </p>
                    </div>
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
          gradient="from-primary-500 to-primary-600"
        />
        <QuickActionCard
          title="View All Repairs"
          description="See all repair orders"
          href="/dashboard/repairs"
          gradient="from-purple-500 to-purple-600"
        />
        <QuickActionCard
          title="Manage Pricing"
          description="Update repair pricing"
          href="/dashboard/pricing"
          gradient="from-orange-500 to-orange-600"
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color, trend }: {
  title: string
  value: string
  icon: React.ReactNode
  color: 'blue' | 'yellow' | 'green' | 'purple'
  trend?: string
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
    green: 'from-success-500 to-success-600 shadow-success-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30'
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100 hover:shadow-medium smooth-transition group">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className={`bg-gradient-to-br ${colorClasses[color]} text-white p-3 rounded-xl shadow-lg group-hover:scale-110 smooth-transition`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          <span className="text-xs font-semibold text-success-600 bg-success-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

function QuickActionCard({ title, description, href, gradient }: {
  title: string
  description: string
  href: string
  gradient: string
}) {
  return (
    <a
      href={href}
      className="group block bg-white rounded-2xl shadow-soft p-6 border border-gray-100 hover:shadow-medium smooth-transition overflow-hidden relative"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 smooth-transition`}></div>
      <div className="relative">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 smooth-transition">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
        <ArrowUpRight className="h-5 w-5 text-gray-400 absolute top-0 right-0 group-hover:text-primary-600 group-hover:translate-x-1 group-hover:-translate-y-1 smooth-transition" />
      </div>
    </a>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700 border border-gray-200',
    in_progress: 'bg-blue-100 text-blue-700 border border-blue-200',
    waiting_parts: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    completed: 'bg-success-100 text-success-700 border border-success-200',
    ready_pickup: 'bg-purple-100 text-purple-700 border border-purple-200',
    delivered: 'bg-success-100 text-success-700 border border-success-200',
    cancelled: 'bg-danger-100 text-danger-700 border border-danger-200'
  }
  return colors[status] || 'bg-gray-100 text-gray-700 border border-gray-200'
}
